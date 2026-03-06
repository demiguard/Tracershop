"""LDAP module

This module
"""

# Python Standard Library
from enum import Enum
from logging import getLogger
from typing import List, Tuple, Any, Dict, Optional

# Third Party Packages
import ldap
from ldap.ldapobject import LDAPObject
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

# Tracershop packages
from constants import ERROR_LOGGER, DEBUG_LOGGER
from production.SECRET_KEY import LDAP_CERT_PATH
from database.models import UserGroups, User
from tracerauth.types import LDAPSearchResult

base_ldap_path = "OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
ldap_server    = "ldap://regionh.top.local"

USER_REGIONAL_ID_KEY = "UserRegionalID"

ldapTracershopGroups = {
  "RGH-B-SE Tracershop Production-User"  : UserGroups.ProductionUser,
  "RGH-B-SE Tracershop Shop-Admin"       : UserGroups.ShopAdmin,
  "RGH-B-SE Tracershop Shop-User"        : UserGroups.ShopUser,
  "RGH-B-SE Tracershop Production-Admin" : UserGroups.ProductionAdmin,
  "RGH-B-SE Tracershop Site-Admin"       : UserGroups.Admin,
}

error_logger = getLogger(ERROR_LOGGER)
debug_logger = getLogger(DEBUG_LOGGER)

class LDAPConnection: #pragma: no cover
  def __init__(self, username: str=settings.AUTH_LDAP_BIND_DN, password: str=settings.AUTH_LDAP_BIND_PASSWORD) -> None:
    self.username = username
    self.password = password

  def __enter__(self):
    self.conn = ldap.initialize(ldap_server)
    self.conn.set_option(ldap.OPT_X_TLS_CACERTFILE, LDAP_CERT_PATH) # type: ignore
    self.conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER) # type: ignore
    self.conn.set_option(ldap.OPT_X_TLS_NEWCTX, 0) # type: ignore
    self.conn.start_tls_s()
    self.conn.simple_bind_s(self.username, self.password)
    return self.conn

  def __exit__(self, exception_type, exception, traceback):
    if exception_type or exception:
      error_logger.error(f"While performing an LDAP query encountered the {exception}")
    try:
      self.conn.unbind()
    except:
      pass

def _query_username(username: str, conn: Optional[LDAPObject]=None): #pragma: no cover
  if conn is None:
    with LDAPConnection() as conn:
      base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
      searchFilter = f"(&(cn={username}))"
      return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter)

  base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
  searchFilter = f"(&(cn={username}))"
  return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter) # type: ignore

def _extract_user_properties(query) -> Dict[str, Any] | None: #pragma: no cover
  if len(query):
    return query[0][1]
  return None

def _user_group_from_user_properties(props: Dict[str, Any] | None) -> UserGroups:
  if props is None or 'memberOf' not in props:
    return UserGroups.Anon

  for group_bytes in props['memberOf'] :
    group_str = group_bytes.decode()
    for ldapTracershopGroupsName in ldapTracershopGroups.keys():
      if ldapTracershopGroupsName in group_str:
        return ldapTracershopGroups[ldapTracershopGroupsName]

  return UserGroups.Anon

def checkUserGroupMembership(username: str) ->  Tuple[LDAPSearchResult, Optional[UserGroups]]: #pragma: no cover
  """Queries connected LDAP system for a user's tracershop user group
  return None if the user doesn't exists

  Args:
      username (str): The identifier

  Returns:
      Optional[UserGroups]: _description_

  Note: This function is mocked due to dependency on LDAP server
  to mock:
  >>> from tracerauth.tests.mocks import mock_ldap
  >>> with patch('tracerauth.ldap.checkUserGroupMembership', mocks_ldap.checkUserGroupMembership):
  ...    from dependant_module import function/Class # to test
  """
  user_properties = _extract_user_properties(_query_username(username))
  if user_properties is None:
    return LDAPSearchResult.USER_DOES_NOT_EXISTS, None

  user_group = UserGroups.Anon

  if USER_REGIONAL_ID_KEY in user_properties:
    regional_id = user_properties[USER_REGIONAL_ID_KEY][0].decode()
    if regional_id != username:
      regional_properties = _extract_user_properties(_query_username(username))
      # Some thing some max indent
      user_group = _user_group_from_user_properties(regional_properties)

  if user_group == UserGroups.Anon:
    user_group = _user_group_from_user_properties(user_properties)

  if user_group != UserGroups.Anon:
    return LDAPSearchResult.SUCCESS, user_group

  return LDAPSearchResult.MISSING_USER_GROUP, user_group


def _authenticate_user(username: str, password: str, conn:LDAPObject):
  upper_username = username.upper()

  result = conn.search_s(
    "OU=Region Hovedstaden,DC=regionh,DC=top,DC=local",
    ldap.SCOPE_SUBTREE,
    f"(sAMAccountName={upper_username})"
  )

  if not isinstance(result, List) or len(result) == 0: # Empty Query
    error_logger.info(f"Could not find {upper_username} in LDAP User database")
    return False

  user_properties = _extract_user_properties(result)
  if user_properties is None:
    print(f"Unable to extract user data for {username}")
    return False

  if 'UserRegionalID' not in user_properties or 'distinguishedName' not in user_properties:
    print(f"Malform userdata for {username}")
    error_logger.error(f"While Authenticating {upper_username} did not contain UserRegionalID or distinguishedName")
    return False

  og_dn = user_properties['distinguishedName'][0].decode()

  regionalID = str(user_properties['UserRegionalID'][0].decode())
  if regionalID != upper_username:
    print(f"{regionalID}, {upper_username}")
    regional_result = _extract_user_properties(conn.search_s(
      "OU=Region Hovedstaden,DC=regionh,DC=top,DC=local",
      ldap.SCOPE_SUBTREE,
      f"(sAMAccountName={regionalID})"
    ))

    if regional_result is None:
      error_logger.info("Unable to find regional id")
      return False
    distinguishedName = regional_result['distinguishedName'][0].decode()
  else:
    distinguishedName = user_properties['distinguishedName'][0].decode()

  conn.unbind_s()

  try:
    ldap_authenticate(distinguishedName, password)
    return True

  except ldap.INVALID_CREDENTIALS:
    error_logger.info(f"User: {distinguishedName} Invalid Credentials")

  if og_dn != distinguishedName:
    try:
      ldap_authenticate(og_dn, password)
      return True
    except ldap.INVALID_CREDENTIALS:
      error_logger.info(f"User: {distinguishedName} Invalid Credentials")

  return False

def authenticate_user(username: str, password: str):
  with LDAPConnection() as conn:
    return _authenticate_user(username, password, conn)

def ldap_authenticate(distinguished_name, password):
  conn = ldap.initialize(ldap_server)
  conn.set_option(ldap.OPT_X_TLS_CACERTFILE, LDAP_CERT_PATH) # type: ignore
  conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER) # type: ignore
  conn.set_option(ldap.OPT_X_TLS_NEWCTX, 0) # type: ignore
  conn.start_tls_s()

  conn.simple_bind_s(distinguished_name, password)

  conn.unbind_s()

def _get_regional_id(username: str, conn: LDAPObject):
  user_properties = _extract_user_properties(_query_username(username, conn))

  if user_properties is None or USER_REGIONAL_ID_KEY not in user_properties:
    return ""

  return user_properties[USER_REGIONAL_ID_KEY][0].decode()

def get_regional_id(username: str):
  with LDAPConnection() as conn:
    return _get_regional_id(username, conn)

def get_ldap_user(username: str):
  """Retrieves

  Args:
      username (str): A regional ID or BAM id of a user

  Returns:
    User - the unique user that is referred to with the username

  Throws
    django.core.exceptions.ObjectDoesNotExists - if It can find a user
  """

  try:
    return User.objects.get(username=username)
  except ObjectDoesNotExist:
    pass

  try:
    return User.objects.get(bam_id=username)
  except ObjectDoesNotExist:
    pass

  # User doesn't exists locally lets check LDAP database and create a record.

  regional_id = get_regional_id(username)

  if regional_id == "": # It's not found in
    raise ObjectDoesNotExist

  success, user_group = checkUserGroupMembership(username)

  if user_group is None:
    user_group = UserGroups.Anon

  return User.objects.create(
    username=regional_id,
    bam_id=username,
    user_group=user_group
  )

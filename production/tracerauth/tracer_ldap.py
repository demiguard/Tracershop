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

# Tracershop packages
from constants import ERROR_LOGGER
from production.SECRET_KEY import LDAP_CERT_PATH
from database.models import UserGroups
from tracerauth.types import LDAPSearchResult

base_ldap_path = "OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
ldap_server    = "ldap://regionh.top.local"

ldapTracershopGroups = {
  "RGH-B-SE Tracershop Production-User"  : UserGroups.ProductionUser,
  "RGH-B-SE Tracershop Shop-Admin"       : UserGroups.ShopAdmin,
  "RGH-B-SE Tracershop Shop-User"        : UserGroups.ShopUser,
  "RGH-B-SE Tracershop Production-Admin" : UserGroups.ProductionAdmin,
  "RGH-B-SE Tracershop Site-Admin"       : UserGroups.Admin,
}

error_logger = getLogger(ERROR_LOGGER)


class LDAPConnection: #pragma: no cover
  def __init__(self, username=settings.AUTH_LDAP_BIND_DN, password=settings.AUTH_LDAP_BIND_PASSWORD) -> None:
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
    self.conn.unbind()

def _query_username(username: str, conn: Optional[LDAPObject]=None): #pragma: no cover
  if conn is None:
    with LDAPConnection() as conn:
      base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
      searchFilter = f"(&(cn={username}))"
      return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter)
  base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
  searchFilter = f"(&(cn={username}))"
  return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter) # type: ignore

def _extract_user_properties(query) -> Dict[str, Any]: #pragma: no cover
  if len(query):
    return query[0][1]
  return None

def checkUserGroupMembership(username: str) ->  Tuple[LDAPSearchResult, Optional[UserGroups]]: #pragma: no cover
  """Queries connected LDAP system for a user's tracershop user group
  return None if the user doesn't exists

  Args:
      username (str): _description_

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

  if 'memberOf' in user_properties:
    for group_bytes in user_properties['memberOf']:
      group_str = group_bytes.decode()
      for ldapTracershopGroupsName in ldapTracershopGroups.keys():
        if ldapTracershopGroupsName in group_str:
          return LDAPSearchResult.SUCCESS, ldapTracershopGroups[ldapTracershopGroupsName]
  return LDAPSearchResult.MISSING_USER_GROUP, None

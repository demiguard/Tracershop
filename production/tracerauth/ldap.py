# Python Standard Library
from logging import getLogger
from typing import List, Tuple, Any, Dict, Optional

# Third Party Packages
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
import ldap
from ldap.ldapobject import LDAPObject

# Tracershop packages
from constants import ERROR_LOGGER
from production.SECRET_KEY import LDAP_USERNAME, LDAP_PASSWORD, LDAP_CERT_PATH
from database.models import User, UserGroups, Customer, UserAssignment


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

class LDAPConnection:
  def __init__(self, username=LDAP_USERNAME, password=LDAP_PASSWORD) -> None:
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

def query_username(username: str, conn: Optional[LDAPObject]=None):
  if conn is None:
    with LDAPConnection() as conn:
      base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
      searchFilter = f"(&(cn={username}))"
      return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter)
  base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
  searchFilter = f"(&(cn={username}))"
  return conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter) # type: ignore

def _extract_user_properties(query) -> Dict[str, Any]:
  if len(query):
    return query[0][1]
  return None

def _extract_UserAssignments(user, user_properties):
  street_address = None
  uas = []

  if 'streetAddress' in user_properties:
    for binary_street_address in user_properties['streetAddress']:
      street_address = binary_street_address.decode()
      for customer in Customer.objects.all():
        if(customer.billing_address == street_address):
          ua = UserAssignment(user=user, customer=customer)
          ua.save()
          uas.append(ua)
  else:
    error_logger.error(f"user properties for {user.username} doesn't contain a street address")

  return street_address, uas

def guess_customer_group(username: str) -> Tuple[Optional[str], List[UserAssignment]]:
  user_properties = _extract_user_properties(query_username(username))
  if user_properties is None:
    return None, []
  try:
    user = User.objects.get(username=username)
  except ObjectDoesNotExist:
    error_logger.error(f"user {username} doesn't exists!")
    return None, []
  except MultipleObjectsReturned:
    error_logger.error(f"user {username} returns multiple objects!")
    return None, []

  street_address, uas = _extract_UserAssignments(user, user_properties)

  return street_address, uas


def checkUserGroupMembership(username: str) -> Optional[UserGroups]:
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

  query = query_username(username)

  if len(query):
    user_properties = query[0][1]
    if 'memberOf' in user_properties:
      for group_bytes in user_properties['memberOf']:
        group_str = group_bytes.decode()
        for ldapTracershopGroupsName in ldapTracershopGroups.keys():
          if ldapTracershopGroupsName in group_str:
            return ldapTracershopGroups[ldapTracershopGroupsName]
  return None


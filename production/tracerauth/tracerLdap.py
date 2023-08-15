# Python Standard Library
import ldap
from typing import List, Tuple, Any, Dict, Optional

# Third Party Packages

# Tracershop packages
from production.SECRET_KEY import LDAP_USERNAME, LDAP_PASSWORD, LDAP_CERT_PATH
from database.models import User, UserGroups


base_ldap_path = "OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
ldap_server    = "ldap://regionh.top.local"

ldapTracershopGroups = {
  "RGH-B-SE Tracershop Production-User" : UserGroups.ProductionUser,
  "RGH-B-SE Tracershop Shop-Admin" : UserGroups.ShopAdmin,
  "RGH-B-SE Tracershop Shop-User" : UserGroups.ShopUser,
  "RGH-B-SE Tracershop Production-Admin" : UserGroups.ProductionAdmin,
  "RGH-B-SE Tracershop Site-Admin" : UserGroups.Admin,
}


def _initializeLdapConnection(username=LDAP_USERNAME, password=LDAP_PASSWORD):
  conn = ldap.initialize(ldap_server)
  conn.set_option(ldap.OPT_X_TLS_CACERTFILE, LDAP_CERT_PATH) # type: ignore
  conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER) # type: ignore
  conn.set_option(ldap.OPT_X_TLS_NEWCTX, 0) # type: ignore
  conn.start_tls_s()
  conn.simple_bind_s(username, password)
  return conn

def checkUserGroupMembership(username: str) -> UserGroups:
  conn = _initializeLdapConnection()
  base="OU=Region Hovedstaden,DC=regionh,DC=top,DC=local"
  searchFilter = f"(&(cn={username}))"
  query: List[Tuple[Any, Dict[str, List[bytes]]]] = conn.search_s(base,ldap.SCOPE_SUBTREE, searchFilter) # type: ignore
  if len(query):
    user_properties = query[0][1]
    if 'memberOf' in user_properties:
      for group_bytes in user_properties['memberOf']:
        group_str = group_bytes.decode()
        for ldapTracershopGroupsName in ldapTracershopGroups.keys():
          if ldapTracershopGroupsName in group_str:
            return ldapTracershopGroups[ldapTracershopGroupsName]
  return UserGroups.Anon


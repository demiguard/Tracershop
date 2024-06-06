"""Due to external dependency on LDAP server these are the mocks. you should

"""

# Python Standard Library

# Third party packages

# Tracershop packages
from database.models import UserGroups

mockedUserGroups = {
  '-AAAA0000' : UserGroups.Admin,
  '-AAAA0001' : UserGroups.ProductionAdmin,
  '-AAAA0002' : UserGroups.ProductionUser,
  '-AAAA0003' : UserGroups.ShopAdmin,
  '-AAAA0004' : UserGroups.ShopUser,
  '-AAAA0005' : UserGroups.Anon,
  # Note there's no user group External, since this user doesn't have a BAM ID
  # Therefore they cannot be returned from the LDAP service
}

FAKE_LDAP_CN = 'BLA BLA BLA BLA'

class LDAPConnection():
  class FakeLDAPObject:
    def search_s(self, *args, **kwargs):
      return [
        (FAKE_LDAP_CN, {
          'memberOf' : [b'RGH-B-SE Tracershop Site-Admin'],
          'streetAddress' : [b'customer_1_billing_address']
        })
      ]

  def __enter__(self):
    return self.FakeLDAPObject()
  
  def __exit__(self, exception_type, exeception_value, traceback):
    pass

class EmptyLDAPConnection():
  class FakeLDAPObject:
    def search_s(self, *args, **kwargs):
      return []

  def __enter__(self):
    return self.FakeLDAPObject()
  
  def __exit__(self, exception_type, exeception_value, traceback):
    pass

class AlteredLDAPConnection:
  class FakeLDAPObject:
    def search_s(self, *args, **kwargs):
      return [
        (FAKE_LDAP_CN, {})
      ]

  def __enter__(self):
    return self.FakeLDAPObject()

  def __exit__(self, exception_type, exeception_value, traceback):
    pass

def checkUserGroupMembership(username: str) -> UserGroups:
  return mockedUserGroups.get(username, None)
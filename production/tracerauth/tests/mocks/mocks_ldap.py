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

def checkUserGroupMembership(username: str) -> UserGroups:
  return mockedUserGroups.get(username, None)
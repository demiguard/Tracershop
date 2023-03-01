from django.http import HttpRequest

from typing import List

from customer.models import UserHasAccess, User
from customer.lib.CustomTools import LMap

def getCustomers(user) -> List[User]:
  return LMap(
    lambda x: x.CustomerID,
    UserHasAccess.objects.filter(userID=user).order_by('CustomerID')
  )

def GetActiveCustomer(request: HttpRequest) -> int:
  if activeCustomerCookie := request.COOKIES.get("ActiveCustomer"):
    return int(activeCustomerCookie)

  customerIDs = getCustomers(request.user)

  if customerIDs == []:
    return -1

  return customerIDs[0].ID


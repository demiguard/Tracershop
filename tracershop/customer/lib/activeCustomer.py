from customer.models import UserHasAccess
from customer.lib.CustomTools import LMap

def getCustomers(user):
  return LMap(
    lambda x: x.CustomerID, 
    UserHasAccess.objects.filter(userID=user).order_by('CustomerID')
  )


def GetActiveCustomer(request):
  if activeCustomerCookie := request.COOKIES.get("ActiveCustomer"):
    return int(activeCustomerCookie)

  customerIDs = getCustomers(request.user)

  if customerIDs == []:
    return -1
    
  return customerIDs[0].ID


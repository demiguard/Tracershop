from django.contrib.auth.mixins import LoginRequiredMixin

from django.views.generic import View
from django.http import JsonResponse, HttpResponse, Http404

from customer.models import UserHasAccess, Customer, User
from customer.lib.Formatting import ParseJSONRequest


class APIUserAccess(LoginRequiredMixin, View):
  name = "APIGetUserAccesss"
  path = "myadmin/api/UserAccess/<int:userID>"
  def get(self, request, userID):
    InternalCustomers = Customer.objects.all().filter(is_REGH=True)
    UserAccesses = set(map(lambda x : x.CustomerID, UserHasAccess.objects.all().filter(userID=userID)))
    
    # Data
    customerNames = [InternalCustomer.customerName for InternalCustomer in InternalCustomers]
    customerIDs = [InternalCustomer.ID for InternalCustomer in InternalCustomers]
    Assignments = [InternalCustomer in UserAccesses for InternalCustomer in InternalCustomers]

    return JsonResponse({
      "customerNames" : customerNames,
      "customerIDs" : customerIDs,
      "assignments" : Assignments
    })    

  def post(self, request, userID):
    requestData = ParseJSONRequest(request)
    customerID  = requestData["customerID"]
    
    try:
      user = User.objects.get(ID=userID)
      customer = Customer.objects.get(ID=customerID)
      UserHasAccess(userID=user, CustomerID=customer).save()
      
      return HttpResponse(status=204)
    except:
      return Http404()

  def delete(self, request, userID):
    requestData = ParseJSONRequest(request)
    customerID  = int(requestData["customerID"])
    
    try:
      user = User.objects.get(ID=userID)
      customer = Customer.objects.get(ID=customerID)
      UserHasAccess.objects.all().filter(userID=user, CustomerID=customer).delete()


      return HttpResponse(status=204)
    except:
      return Http404()
  
  
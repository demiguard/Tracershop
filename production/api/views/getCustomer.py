from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from api.lib.SQL import SQLController
from api.utils import LMAP

class ApiGetCustomer(View):
  name = "getCustomer"
  path = "getCustomer/<int:ID>"

  def get(self, request, ID):

    CustomerData = SQLController.getCustomer(ID)
    CustomerData.update(SQLController.getCustomerDeliverTimes(ID))
    
    return JsonResponse(CustomerData)
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib.utils import LMAP

class ApiGetCustomer(View):
  name = "getCustomer"
  path = "getCustomer/<int:ID>"

  def get(self, request, ID):

    CustomerData = SQLController.getCustomer(ID)
    DeliverTimes = (SQLController.getCustomerDeliverTimes(ID))

    return JsonResponse({
      "customer" : CustomerData,
      "deliverTimes" : DeliverTimes
    })
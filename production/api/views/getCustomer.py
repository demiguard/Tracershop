from django.views.generic import View
from django.http import JsonResponse

from lib.SQL import SQLController

from constants import JSON_CUSTOMER, JSON_DELIVERTIMES

class APIGetCustomer(View):
  """
    This endpoint retrieves the deliver times availble to a specific customer
  """
  name = "getCustomer"
  path = "getCustomer/<int:ID>"

  def get(self, request, ID):
    return JsonResponse({
      JSON_CUSTOMER : SQLController.getCustomer(ID),
      JSON_DELIVERTIMES : SQLController.getCustomerDeliverTimes(ID)
    })
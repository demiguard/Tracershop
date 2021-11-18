from django.views.generic import View
from django.http import JsonResponse

from lib.SQL import SQLController

from constants import JSON_CUSTOMER

class APIGetCustomers(View):
  """
    This endpoint retrieves the users from the User table, that can order products.
  """
  name = "getCustomers"
  path = "getCustomers"

  def get(self, request):
    return JsonResponse({
      JSON_CUSTOMER : SQLController.getCustomers()
    })

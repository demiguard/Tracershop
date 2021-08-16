from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController


class ApiGetCustomers(View):
  name = "getCustomers"
  path = "getCustomers"

  def get(self, request):

    Result = SQLController.getCustomers()
    
    
    return JsonResponse({
      "customers" : Result
    })
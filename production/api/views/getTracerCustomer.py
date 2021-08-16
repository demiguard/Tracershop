from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class APIGetTracerCustomer(View):
  name = "getTracerCustomer"
  path = "getTracerCustomer"

  def get(self,request):
    return JsonResponse({
      "data" : SQLController.getTracerCustomer()
    })

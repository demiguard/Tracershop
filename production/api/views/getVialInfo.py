from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import date, timedelta

from lib.SQL import SQLController
from lib.utils import LMAP

"""
  This endpoint is responsible for getting daily vials, and not historic vials. 
  The idea here is in the common use case we do not need historic vials. 
  So if a user needs it they can use another endpoint.
  This endpoint also have additional information such as the different users availble.

  One could start to think if one should inject the basic data into the site so they don't get it from every endpoint
"""

HISTORIC_RANGE = 7


class ApigetVialInfo(View):
  path = "getVialInfo"
  name = "APIgetVialInfo"

  def get(self, request):
    today = date.today()
    historic_date = today - timedelta(days=HISTORIC_RANGE)
    Vials = SQLController.getVialRange(historic_date, today)

    customers = SQLController.getCustomers()

    return JsonResponse({
      "vials" : Vials,
      "customers" : customers
    })
    
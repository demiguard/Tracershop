from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import date

from constants import JSON_ORDERS

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController


class APIGetSpecialTracerOrders(View):
  name = "getspecialtracerOrders"
  path = "getspecialtracerOrders/<int:year>/<int:month>/<int:day>"

  def get(self, request,year : int, month : int, day : int):
    try:
      request_date = date(year, month, day)
    except ValueError:
      return HttpResponseBadRequest()

    return ProductionJSONResponse({
      JSON_ORDERS : SQLController.getTOrders(request_date)
    })
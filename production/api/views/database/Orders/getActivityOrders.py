from django.views.generic import View
from django.http import HttpResponseBadRequest

from datetime import date

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController

from constants import JSON_ORDERS, JSON_PRODUCTIONS, JSON_VIALS

class APIGetActivityOrders(View):
  name = "getActivityOrders"
  path = "getActivityOrders/<int:tracerID>/<int:year>/<int:month>/<int:day>"

  def get(self, request, tracerID: int, year: int, month: int, day: int):
    try:
      requestDate = date(year, month, day)
    except ValueError:
      return HttpResponseBadRequest()

    Orders = SQLController.getActivityOrders(requestDate, tracerID)
    productions = SQLController.GetDeliverTimes()
    vials = SQLController.getVials(requestDate)

    return ProductionJSONResponse({
      JSON_ORDERS : Orders,
      JSON_PRODUCTIONS : productions,
      JSON_VIALS : vials
    })

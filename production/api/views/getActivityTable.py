from django.views.generic import View
from django.http import HttpResponseBadRequest

from datetime import date

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController

from constants import JSON_CUSTOMER, JSON_ORDERS, JSON_PRODUCTIONS, JSON_RUNS, JSON_VIALS

class APIGetActivityTable(View):
  name = "getActivityTable"
  path = "getActivityTable/<int:tracerID>/<int:year>/<int:month>/<int:day>"

  def get(self, request, tracerID: int, year: int, month: int, day: int):
    try:
      requestDate = date(year, month, day)
    except ValueError:
      return HttpResponseBadRequest()


    Orders = SQLController.getActivityOrders(requestDate, tracerID)

    runs = SQLController.getRuns()
    customers = SQLController.getCustomers()
    productions = SQLController.GetDeliverTimes()
    vials    = SQLController.getVials(requestDate)

    return ProductionJSONResponse({
      JSON_CUSTOMER : customers,
      JSON_ORDERS : Orders,
      JSON_PRODUCTIONS : productions,
      JSON_RUNS   : runs,
      JSON_VIALS : vials
    })

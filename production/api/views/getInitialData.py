from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class ApiGetInitialData(View):
  name = "getInitialInformation"
  path = "getinitialinformation"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    Orders = SQLController.getFDGOrders(data["year"], data["month"], data["day"])

    runs = SQLController.getRuns()
    customers = SQLController.getCustomers()
    productions = SQLController.getProductions()
    vials    = SQLController.getVials(data["year"], data["month"], data["day"])



    return JsonResponse({
      "Orders" : Orders,
      "Runs"   : runs,
      "customers" : customers,
      "productions" : productions,
      "vials" : vials
    })

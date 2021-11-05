from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class ApiGetActivityOrders(View):
  name = "getActivityOrders"
  path = "getActivityOrders"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    Orders = SQLController.getActivityOrders(data["year"], data["month"], data["day"], data["tracer"])
    productions = SQLController.getProductions()
    vials = SQLController.getVials(data["year"], data["month"], data["day"])


    return JsonResponse({
      "Orders" : Orders,
      "productions" : productions,
      "vials" : vials
    })

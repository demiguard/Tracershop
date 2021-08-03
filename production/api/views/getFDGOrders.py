from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class ApiGetFDGOrders(View):
  name = "getFDGOrders"
  path = "getFDGOrders"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    Orders = SQLController.getFDGOrders(data["year"], data["month"], data["day"])

    return JsonResponse({
      "Orders" : Orders
    })
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class ApiGetSpecialTracers(View):
  name = "getspecialtracers"
  path = "getspecialtracers"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    Orders = SQLController.getTOrders(data["year"], data["month"], data["day"])

    return JsonResponse({
      "Orders" : Orders
    })
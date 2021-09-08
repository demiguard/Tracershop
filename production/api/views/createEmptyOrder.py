from django.views.generic import View
from django.http import JsonResponse

from lib.SQL import SQLController
from lib import Formatting


class APICreateEmptyFDGOrder(View):
  name = "createEmptyFDGOrder"
  path = "createEmptyFDGOrder"

  def post(self, request):
    newOrderData = Formatting.ParseJSONRequest(request)

    newOrder     = SQLController.createEmptyFDGOrder(
      newOrderData["CustomerID"],
      Formatting.FormatDateTimeJStoSQL(newOrderData["orderDateTime"]),
      newOrderData["run"],
      "This order have been created due to the moving of orders to an empty time slot."
    )

    return JsonResponse(newOrder)

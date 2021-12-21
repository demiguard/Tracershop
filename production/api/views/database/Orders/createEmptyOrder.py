from django.views.generic import View

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController


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

    return ProductionJSONResponse(newOrder)

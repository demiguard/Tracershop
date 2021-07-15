from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from  api.lib import Formatting
from api.lib.SQL import SQLController
from api.utils import LMAP


class ApiMonthColorEndpoint(View):
  name = "MonthColor"
  path = "monthcolor"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    year = data["year"]
    month = data["month"]

    orders = SQLController.getOrderMonthlyStatus(year, month)
    tOrders = SQLController.getTorderMonthlyStatus(year, month)

    MergedDict = Formatting.mergeMonthlyOrders(year, month, orders, tOrders)
    
    formattedDict = Formatting.EncodeDateTimeDict(MergedDict)

    return JsonResponse(formattedDict)

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib import Filters, Formatting
from customer.lib import calenderHelper
from customer.lib.CustomTools import LMap
from customer.lib.SQL import SQLController as SQL

import datetime

class ApiOrderDate(View):
  path = 'api/order_date/<int:year>/<int:month>/<int:day>'
  name = "ApiOrderDate"

  def get(self, request, year, month, day):
    try:
      dt_object = datetime.datetime(year,month,day)
    except ValueError:
      return HttpResponseBadRequest()

    if SQL.getClosed(dt_object):
      pass

    userID = request.GET['UserID']
    order = SQL.queryOrderByDate(dt_object, userID)
    runs = SQL.getDailyRuns(dt_object, userID)
    tOrders = SQL.getDailyTOrders(dt_object, userID)
    tOrderForms = SQL.getTOrdersForms(userID)

    response_dir = {
      'responses' : Filters.matchOrders(order, runs),
      'tOrders'   : LMap(Formatting.formatUse, tOrders),
      'tOrdersForms' : tOrderForms
    }

    for order in response_dir['responses']:
      if order['data_type'] == "form":
        del order['data']

    return JsonResponse(response_dir)    

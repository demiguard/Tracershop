from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib import calenderHelper
from customer.lib import Filters
from customer.lib import Formatting
from customer.lib import orders
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
    
    closedDates = SQL.monthlyCloseDates(year, month)
    userID = request.GET['UserID']
    order = SQL.queryOrderByDate(dt_object, userID)
    runs = SQL.getDailyRuns(dt_object, userID)
    responses = Filters.matchOrders(order, runs)

    tOrders = SQL.getDailyTOrders(dt_object, userID)
    if orders.isOrderTAvailableForDate(dt_object, closedDates):
      tOrderForms = SQL.getTOrdersForms(userID)
    else:
      tOrderForms = []

    if not orders.isOrderFDGAvailalbeForDate(dt_object, closedDates):
      responses = orders.removeOrdersFromList(responses) 

    response_dir = {
      'responses'    : responses,
      'tOrders'      : tOrders,
      'tOrdersForms' : tOrderForms
    }

    for order in response_dir['responses']:
      if order['data_type'] == "form":
        del order['data']

    return JsonResponse(response_dir)    

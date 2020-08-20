from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib import orderHelper
from customer.lib import sqlCurator as sql
from customer.lib import calenderHelper

import datetime



class Api_order_date(View):
  def get(self, request, year, month, day):
    print("hello world")
    try:
      dt_object = datetime.datetime(year,month,day)
    except ValueError:
      return HttpResponseBadRequest()

    if sql.get_closed(dt_object):
      pass

    userID = 7

    order = sql.query_order_by_date(dt_object, userID)
    runs = sql.get_daily_runs(dt_object, userID)

    response_dir = {
      'responses' : orderHelper.matchOrders(order, runs)
    }

    for order in response_dir['responses']:
      if order['data_type'] == "form":
        del order['data']

    return JsonResponse(response_dir)    

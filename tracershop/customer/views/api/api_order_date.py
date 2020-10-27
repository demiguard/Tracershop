from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib import orderHelper
from customer.lib.SQL import SQLController as SQL
from customer.lib import calenderHelper

import datetime

def formatUse(adir):
  if 'use' in adir:
    if (adir['use'] == 'Human'):
      adir['use'] = 'Menneske'
  
  return adir

class Api_order_date(View):
  def get(self, request, year, month, day):
    try:
      dt_object = datetime.datetime(year,month,day)
    except ValueError:
      return HttpResponseBadRequest()

    if SQL.getClosed(dt_object):
      pass

    
    print(request.readlines())

    userID = request.GET['UserID']

    order = SQL.queryOrderByDate(dt_object, userID)
    runs = SQL.getDailyRuns(dt_object, userID)

    tOrders = SQL.getDailyTOrders(dt_object, userID)
    


    response_dir = {
      'responses' : orderHelper.matchOrders(order, runs),
      #formatting mapping
      'tOrders'   : list(map(formatUse, tOrders))
    }

    for order in response_dir['responses']:
      if order['data_type'] == "form":
        del order['data']

    return JsonResponse(response_dir)    

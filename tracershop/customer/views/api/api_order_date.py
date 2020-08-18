from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse, HttpResponseBadRequest
from customer.lib import sqlCurator as sql

import datetime

def handle_null_dt(dt):
  if dt:
    return dt.strftime("%H:%M")
  else:
    return None




class Api_order_date(View):
  def get(self, request, year, month, day):
    try:
      dt_object = datetime.datetime(year,month,day)
    except ValueError:
      return HttpResponseBadRequest()

    if sql.get_closed(dt_object):
      pass

    userID = 7

    query = sql.query_order_by_date(dt_object, userID)
    order = sql.get_daily_runs(dt_object, userID)

    response_list = []

    response_dir = {
      responses : response_list  
    }

    return JsonResponse(response_dir)    

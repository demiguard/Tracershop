from django.shortcuts import render
from django.views.generic import TemplateView

import datetime
import json

from customer import forms

from customer.lib import sqlCurator
from customer.lib import calenderHelper
from customer.lib import orderHelper

def map_tuple(x):
  return {
    'status' : x[0],
    'orderID' : x[1],
    'ordered_amount': x[2],
    'total_amount' : x[4],
    'batchnr' : x[5],
    'free_amount' : x[6],
    'free_dt'  : x[7]
  }


class IndexView(TemplateView):
  template_name = 'customer/sites/index.html'

  def get(self, request):
    today = datetime.date(2020,8,20) #CHANGE THIS TO ANOTHER DAY WHEN PRODUCTION
    userID = 7

    ### Data construction ###
    # get data #
    is_closed  = sqlCurator.get_closed(today)
    runs       = sqlCurator.get_daily_runs(today, userID)
    injections = sqlCurator.query_order_by_date(today, userID)
    #Compute
    data = orderHelper.matchOrders(injections, runs)
    # Calender construction
    status_tupples = sqlCurator.query_order_by_month(today.year,today.month, userID)
    status_tupples = dict(map(lambda x: (str(x[0]), x[1]), status_tupples))
    
    context = {
      'data'            : data,
      'is_closed'       : is_closed,
      'Dato_DK_format'  : today.strftime('%d/%m/%Y'),
      'today'           : today.strftime('%Y-%m-%d'),
      'orders'          : injections,
      'data_status'     : status_tupples,
    }
    return render(request, self.template_name, context=context)
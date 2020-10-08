from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime
import json

from customer.forms import formFactory
from customer.lib.SQL import SQLController as SQL
from customer.lib import calenderHelper
from customer.lib import orderHelper

def formatUse(adir):
  if 'use' in adir:
    if (adir['use'] == 'Human'):
      adir['use'] = 'Menneske'
  
  return adir


class IndexView(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/index.html'
  login_url = '/login'
  redirect_field_name = 'loginView'

  
  def get(self, request):
    today = datetime.date.today() #CHANGE THIS TO ANOTHER DAY WHEN PRODUCTION
    userID = 7

    ### Data construction ###
    # get data #
    is_closed  = SQL.getClosed(today)
    runs       = SQL.getDailyRuns(today, userID)
    injections = SQL.queryOrderByDate(today, userID)
    #Compute
    data = orderHelper.matchOrders(injections, runs)
    # Calender construction
    status_tupples = SQL.queryOrderByMonth(today.year, today.month, userID)
    
    secondaryOrderFormQuery = SQL.getTOrdersForms(userID)
    secondaryOrdersForms    = formFactory.SecondaryOrderForms(secondaryOrderFormQuery)
    DailyTOrders            = list(map(formatUse, SQL.getDailyTOrders(today, userID)))

    context = {
      'secondaryOrders' : DailyTOrders,
      'secondaryForms'  : secondaryOrdersForms,
      'data'            : data,
      'is_closed'       : is_closed,
      'Dato_DK_format'  : today.strftime('%d/%m/%Y'),
      'today'           : today.strftime('%Y-%m-%d'),
      'orders'          : injections,
      'data_status'     : status_tupples,
    }
    return render(request, self.template_name, context=context)
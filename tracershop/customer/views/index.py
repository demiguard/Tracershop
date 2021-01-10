from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime
import json

from customer import models
from customer.forms import formFactory
from customer.lib import calenderHelper, Filters, Formatting
from customer.lib.CustomTools import LMap
from customer.lib.SQL import SQLController as SQL
from customer.lib import orders

class IndexView(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/index.html'
  login_url = '/login'
  redirect_field_name = 'loginView'
  name = "index"
  path = ""
  
  def get(self, request):
    today = datetime.date.today()
    customerIDs = LMap(
      lambda x: (x.CustomerID.ID, x.CustomerID.customerName),
      models.UserHasAccess.objects.filter(userID=request.user).order_by('CustomerID'))

    if customerIDs == []:
      return redirect("customer:editMyCustomer")
    else:
      active_customerID = customerIDs[0][0]

    ### Data construction ###
    # get data #
    is_closed  = SQL.getClosed(today)
    runs       = SQL.getDailyRuns(today, active_customerID)
    injections = SQL.queryOrderByDate(today, active_customerID)
    
    #Compute
    data = Filters.matchOrders(injections, runs)
    
    # Calender construction
    MonthlyOrders           = orders.getMonthlyOrders(today.year, today.month, active_customerID)

    secondaryOrderFormQuery = SQL.getTOrdersForms(active_customerID)
    secondaryOrdersForms    = formFactory.SecondaryOrderForms(secondaryOrderFormQuery)
    DailyTOrders            = SQL.getDailyTOrders(today, active_customerID)
    
    context = {
      'customerIDs'     : customerIDs,
      'secondaryOrders' : DailyTOrders,
      'secondaryForms'  : secondaryOrdersForms,
      'data'            : data,
      'is_closed'       : is_closed,
      'Dato_DK_format'  : today.strftime('%d/%m/%Y'),
      'today'           : today.strftime('%Y-%m-%d'),
      'orders'          : injections,
      'data_status'     : MonthlyOrders,
    }
    return render(request, self.template_name, context=context)
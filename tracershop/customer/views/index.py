from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest

import datetime
import json

from customer import models
from customer.forms import formFactory
from customer.lib import calenderHelper, Filters, Formatting
from customer.lib.CustomTools import LMap
from customer.lib.SQL import SQLController as SQL
from customer.lib import orders, activeCustomer

from customer import constants

class IndexView(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/index.html'
  login_url = '/login'
  redirect_field_name = 'loginView'
  name = "index"
  path = ""

  def get(self, request: HttpRequest):
    today = datetime.date.today()
    active_customerID = activeCustomer.GetActiveCustomer(request)
    serverConfiguration = SQL.getServerConfig()


    customerIDs = LMap(
      lambda x: (x.CustomerID.ID, x.CustomerID.customerName),
      models.UserHasAccess.objects.filter(userID=request.user).order_by('CustomerID'))
    ### Data construction ###
    # get data #
    is_closed  = SQL.getClosed(today)
    runs       = SQL.getDailyRuns(today, active_customerID)
    injections = SQL.queryOrderByDate(today, active_customerID)
    openDays   = SQL.getOpenDays(request.user.ID) #type: ignore # Login required - Defensive programming might be argued here

    #Compute

    # Calender construction
    monthlyCloseDates       = SQL.monthlyCloseDates(today.year, today.month)
    MonthlyOrders           = orders.getMonthlyOrders(today.year, today.month, active_customerID)

    secondaryOrderFormQuery = SQL.getTOrdersForms(active_customerID)

    data = Filters.matchOrders(injections, runs)

    if not orders.isOrderFDGAvailableForDate(today, monthlyCloseDates, openDays):
      data = orders.removeOrdersFromList(data)

    if orders.isOrderTAvailableForDate(today, monthlyCloseDates):
      secondaryOrdersForms = formFactory.SecondaryOrderForms(secondaryOrderFormQuery)
    else:
      secondaryOrdersForms = []
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
      'defaultCalValue' : serverConfiguration.DefaultCalculatorValue,
      'OrderHour'       : calenderHelper.pad_0_to_num(constants.ORDERDEADLINEHOUR),
      'OrderMinute'     : calenderHelper.pad_0_to_num(constants.ORDERDEADLINEMIN),
    }
    response = render(request, self.template_name, context=context)
    response.set_cookie("ActiveCustomer", str(active_customerID), samesite="strict")
    return response
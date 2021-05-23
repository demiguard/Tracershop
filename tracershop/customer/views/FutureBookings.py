from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime

from customer.lib.calenderHelper import getNextWeekday
from customer.lib.CustomTools import LMap
from customer.lib.Filters import FilterBookings
from customer.lib.SQL import  SQLController as SQL
from customer.lib.activeCustomer import GetActiveCustomer, getCustomers
from customer.models import Booking, UserHasAccess, UpdateTimeStamp

def getNextUpdate():
  timeStamps = SQL.getAll(UpdateTimeStamp)
  updateTime = timeStamps.filter(ID=1)[0]
  return updateTime.timeStamp + datetime.timedelta(seconds=900)

class FutureBooking(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/futureBookings.html'
  login_url = '/login'
  redirect_field_name = 'loginView'
  name = "futureBooking"
  path = "futureBooking"

  def get(self, request):
    NextWeekday = getNextWeekday(datetime.date.today())
    
    customers = getCustomers(request.user)

    activeCustomer = GetActiveCustomer(request)
    
    if activeCustomer == -1:
      redirect("customer:editMyCustomer")

    studies = FilterBookings(activeCustomer, NextWeekday)

    context = {
      'customerIDs' : LMap(lambda x: (x.ID, x.customerName), customers),
      'studies' : studies,
      'today' : NextWeekday.strftime("%Y-%m-%d"),
      'todayDanishFormat' : NextWeekday.strftime('%d/%m/%Y'),
      'NextUpdate' : getNextUpdate()
    }
    
    return render(request, self.template_name, context=context)
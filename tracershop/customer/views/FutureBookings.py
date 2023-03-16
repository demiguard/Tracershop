from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime

from customer.lib.calenderHelper import getNextWeekday
from customer.lib.CustomTools import LMap
from customer.lib.orders import getDeadline
from customer.lib.Filters import FilterBookings
from customer.lib.SQL import  SQLController as SQL
from customer.lib.activeCustomer import GetActiveCustomer, getCustomers
from customer.models import Booking, UserHasAccess, UpdateTimeStamp, Tracer

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

    fdg = Tracer.objects.get(tracerName="FDG")
    pib = Tracer.objects.get(tracerName="PIB")

    fdg_deadline = getDeadline(NextWeekday, fdg)
    pib_deadline = getDeadline(NextWeekday, pib)

    if activeCustomer == -1:
      redirect("customer:editMyCustomer")

    studies = FilterBookings(activeCustomer, NextWeekday)
    deliverTimes = SQL.getDailyRuns(NextWeekday, activeCustomer)

    deliverTimes = [{
        'run' : run + 1,
        'dtime' : deliverTime['dtime'].strftime("%H:%M")
      } for run, deliverTime in enumerate(deliverTimes)]

    deliverTimes.reverse()

    context = {
      'customerIDs' : LMap(lambda x: (x.ID, x.customerName), customers),
      'studies' : studies,
      'today' : NextWeekday.strftime("%Y-%m-%d"),
      'todayDanishFormat' : NextWeekday.strftime('%d/%m/%Y'),
      'NextUpdate' : getNextUpdate(),
      'deliverTimes' : deliverTimes,
      'Deadline' : fdg_deadline.strftime("%H:%M %d/%m/%Y"),
      'Deadline_Special' : pib_deadline.strftime("%H:%M %d/%m/%Y"),
    }
    return render(request, self.template_name, context=context)
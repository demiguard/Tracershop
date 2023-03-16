from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import date

from customer.models import Customer, Tracer
from customer.lib.Filters import FilterBookings
from customer.lib.SQL import SQLController as SQL
from customer.lib.orders import getDeadline
from customer.modelsDir.authModels import Booking

class ApiFutureBookingDay(View):
  name = "ApiFutureBookingDay"
  path = "api/FutureDaily/<int:year>/<int:month>/<int:day>"

  #Constants
  USERIDKEY = 'UserID'

  def post(self, request, year, month, day):
    try:
      queryDate = date(year, month, day)
    except Exception as E:
      print(E)
      return HttpResponseBadRequest()

    #TODO Error Handling as statement below may not succeed
    customer = Customer.objects.get(ID=request.POST[self.USERIDKEY])
    bookings = FilterBookings(customer, queryDate)
    deliverTimes = SQL.getDailyRuns(queryDate, request.POST[self.USERIDKEY])

    fdg = Tracer.objects.get(tracerName="FDG")
    pib = Tracer.objects.get(tracerName="PIB")

    fdg_deadline = getDeadline(queryDate, fdg)
    pib_deadline = getDeadline(queryDate, pib)

    response = {
      'bookings' : bookings,
      'deliverTimes' : deliverTimes,
      'Deadline' : fdg_deadline.strftime("%H:%M %d/%m/%Y"),
      'Deadline_special' : pib_deadline.strftime("%H:%M %d/%m/%Y"),
    }

    return JsonResponse(response)

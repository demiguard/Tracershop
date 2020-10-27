from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime

from customer.models import Booking

class FutureBooking(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/futureBookings.html'
  login_url = '/login'
  redirect_field_name = 'loginView'

  def get(self, request):
    #today = datetime.date.today()
    today = datetime.date(2020,10,5)
    userID = request.user.customer_number_id

    
    studies = {}

    #Note SQL query here
    for booking in Booking.objects.filter(startDate=today).order_by("startTime"):
      TracerStr = str(booking.procedure.tracer)
      #Fill BookingInfo with Data to display in HTML file
      injectionDateTime = datetime.datetime.combine(datetime.date.today(), booking.startTime) 
      injectionTimeDelta = datetime.timedelta(seconds=60*booking.procedure.delay)
      injectionTime =  (injectionDateTime + injectionTimeDelta).time()

      bookingInfo = {
        'accessionNumber' : booking.accessionNumber,
        'procedure' : booking.procedure,
        'studyTime' : booking.startTime.strftime("%H:%M"),
        'injectionTime' : injectionTime.strftime("%H:%M")
      }

      if TracerStr in studies:
        studies[TracerStr].append(bookingInfo)
      else:
        studies[TracerStr] = [bookingInfo]


    context={
      'studies' : studies
    }
    

    return render(request, self.template_name, context=context)
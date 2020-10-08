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
    for booking in Booking.objects.filter(startDate=today):
      procedureStr = str(booking.procedure)
      #Fill BookingInfo with Data to display in HTML file
      bookingInfo = {
        'accessionNumber' : booking.accessionNumber
      }

      if procedureStr in studies:
        studies[procedureStr].append(bookingInfo)
      else:
        studies[procedureStr] = [bookingInfo]


    context={
      'studies' : studies
    }
    

    return render(request, self.template_name, context=context)
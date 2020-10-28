from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime

from customer.models import Booking, CustomerUsesLocation, UserHasAccess

class FutureBooking(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/futureBookings.html'
  login_url = '/login'
  redirect_field_name = 'loginView'

  def get(self, request):
    today = datetime.date.today()
        
    user = request.user
    customers = UserHasAccess.objects.filter(userID=user).order_by('CustomerID')
    customers = list(map(lambda x: x.CustomerID, customers))
    if len(customers) == 0:
      redirect("customer:editMyCustomer")
    activeCustomer = customers[0]
    
    studies = {}

    #Note SQL query here
    for booking in Booking.objects.filter(startDate=today).order_by("startTime"):
      if activeCustomer != CustomerUsesLocation.objects.filter(location=booking.location)[0].customer:
        continue
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


    context = {
      'customerIDs' : list(map(lambda x: (x.ID, x.customerName), customers)),
      'studies' : studies,
      'today' : today.strftime('%Y-%m-%d')
    }
    

    return render(request, self.template_name, context=context)
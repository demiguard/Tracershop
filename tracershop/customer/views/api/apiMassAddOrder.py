from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist

from datetime import datetime, date


from customer.constants import SUCCESSFUL_JSON_RESPONSE
from customer.models import Tracer, Booking, Procedure
from customer.lib import orders, calenderHelper
from customer.lib.SQL import SQLController as SQL

datetimeFormatStr = "%Y-%m-%d %H-%M"

class ApiMassAddOrder(LoginRequiredMixin, View):
  path = "api/MassAddOrder"
  name = "APIMassAddOrder"

  def processData(self,qDict):
    tracer = None,
    customer = None
    studies = {}
    for key,item in qDict.items():
      if key == 'tracer':
        try: 
          tracer = Tracer.objects.get(tracerName=item)
        except MultipleObjectsReturned: 
          pass
        except ObjectDoesNotExist:
          pass
      elif key == 'customer':
        customer = int(item)
      
      else: #item = "studies[AccessionNumber]"
        _, study = key.split('[')
        study = study.replace(']','')
        if item == 'true':
          studies[study] = True
        else:
          studies[study] = False
    return tracer, customer, studies


  def post(self, request):
    username = request.user.username
    tracer, customerID, studies = self.processData(request.POST)
    if not(tracer and customerID and studies):
      print("Error")
      return JsonResponse({})
    
    tmpAccessionNumber = list(studies.keys())[0]
    tmp = Booking.objects.get(accessionNumber=tmpAccessionNumber) #TODO Add error handling
    startDate = tmp.startDate
    startTime = tmp.startTime


    if isFDG := tracer.tracerName == "FDG":
      times = {calenderHelper.combine_time_and_date(startDate, item['dtime']) : 0 
            for item in SQL.getDailyRuns(startDate, customerID)}
    

    for accessionNumber, checked in studies.items():
      try:
        booking = Booking.objects.get(accessionNumber=accessionNumber)
      except ObjectDoesNotExist:
        continue
      if booking.status != 0:
        continue
      if not(checked):
        booking.status = 1
        booking.save()
      else:
        if isFDG:
          FDGMBq, time = orders.calculateDosisFDG(booking, customerID, sorted(times.keys()))
          times[time] += FDGMBq
        else:
          bookingDatetime = calenderHelper.combine_time_and_date(booking.startDate, booking.startTime)
          keyStr = bookingDatetime.strftime(datetimeFormatStr)
          orders.insertTOrderBooking(booking, customerID, username)
        booking.status = 2        
        booking.save()

    if isFDG:
      for runm1, (time, fdg) in enumerate(times.items()):
        run = runm1 + 1    # Run are not zero initialized, Take it up with the system administrator
        if fdg > 0:
          SQL.insertOrderFTG(
            fdg,                                # Amount
            "Automaticly generated FDG-order",  # Comment
            time,                               # deliverTime
            startDate,                          # dato
            run,                                # run
            customerID,                         # userID
            username                            # username
          )
    
    return SUCCESSFUL_JSON_RESPONSE


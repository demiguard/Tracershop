from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist

from datetime import datetime, date


from customer.constants import SUCCESSFUL_JSON_RESPONSE
from customer.models import Tracer, Booking, Procedure
from customer.lib import orders, calenderHelper, Formatting
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
      print("key: ", key, "Item: ", item)
      if key == 'tracer':
        try:
          tracer = Tracer.objects.get(tracerName=item)
        except MultipleObjectsReturned:
          pass
        except ObjectDoesNotExist:
          pass
      elif key == 'customer':
        customer = int(item)
      elif key == 'studies': #item = "studies[AccessionNumber]"
        studies = item
    return tracer, customer, studies


  def post(self, request):
    username = request.user.username
    data = Formatting.ParseJSONRequest(request)
    tracer, customerID, studies = self.processData(data)
    if not studies:
      print("Empty mass order")
      return JsonResponse({})

    if not(tracer and customerID and studies):
      return JsonResponse({})

    tmpAccessionNumber = list(studies.keys())[0]
    tmp = Booking.objects.get(accessionNumber=tmpAccessionNumber) #TODO Add error handling
    startDate = tmp.startDate
    startTime = tmp.startTime

    # Validate that Ordering is allowed
    AllowedToOrder = True
    if isFDG := tracer.tracerName == "FDG":
      # Activity Tracers have different allowance than injections tracers
      monthlyCloseDates = SQL.monthlyCloseDates(startDate.year, startDate.month)
      AllowedToOrder = orders.isOrderFDGAvailalbeForDate(startDate, monthlyCloseDates, [0,1,2,3,4])
    else:
      pass


    if not AllowedToOrder:
      return JsonResponse({
        'Success' : 'lateOrdering'
      })


    if isFDG:
      times = {calenderHelper.combine_time_and_date(startDate, item['dtime']) : 0
            for item in SQL.getDailyRuns(startDate, customerID)}

    for accessionNumber, study in studies.items():
      try:
        booking = Booking.objects.get(accessionNumber=accessionNumber)
      except ObjectDoesNotExist:
        continue
      if booking.status != 0:
        continue
      if not(study['checked']):
        booking.status = 1
        booking.save()
      else:
        if isFDG:
          #FDGMBq, time = orders.calculateDosisFDG(booking, customerID, sorted(times.keys()))
          time = datetime.strptime(f"{startDate.year}/{calenderHelper.pad_0_to_num(startDate.month)}/{calenderHelper.pad_0_to_num(startDate.day)} {study['run']}", "%Y/%m/%d %H:%M")
          MBq = orders.calculateDosisForTime(booking, time)
          times[time] += MBq
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


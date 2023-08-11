""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import date
from pathlib import Path

# Third party Packages
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import FileResponse, HttpResponseNotFound
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# Tracershop Production
from lib import pdfGeneration
from database.models import ActivityOrder, ActivityDeliveryTimeSlot, ActivityProduction, DeliveryEndpoint, OrderStatus, Vial

# This is an (almost) single page application
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")

def pdfView(request, 
            endpointID:int,
            tracerID: int,
            year: int,
            month : int,
            day: int):
  # Get data to construct the PDF, if you fail to fetch the needed data 404
  # There should be some logging if you request an address outside
  try:
    order_date = date(year, month, day)
  except ValueError:
    return HttpResponseNotFound(request)

  try:
    endpoint = DeliveryEndpoint.objects.get(pk=endpointID)
  except ObjectDoesNotExist:
    # Maybe add some logging
    return HttpResponseNotFound(request)



  productions = ActivityProduction.objects.filter(tracer__pk=tracerID,
                                                  production_day=order_date.weekday())
  if len(productions) == 0:
    return HttpResponseNotFound(request)

  timeSlots = ActivityDeliveryTimeSlot.objects.filter(destination__pk=endpointID,
                                                      production_run__in=productions)
  if len(timeSlots) == 0:
    return HttpResponseNotFound(request)

  orders = ActivityOrder.objects.filter(status=OrderStatus.Released,
                                        ordered_time_slot__in=timeSlots)
  if len(orders) == 0:
    return HttpResponseNotFound(request)

  vials = Vial.objects.filter(assigned_to__in=orders)
  if len(vials) == 0:
    # Here there should REEEEEALLY be some logs, since there's a database corruption
    return HttpResponseNotFound(request)


  if month < 10:
    month_text = f"0{month}"
  else:
    month_text = str(month)

  filename = f"frontend/static/frontend/pdfs/{endpointID}/{year}/{month_text}/{day}.pdf"

  pdfGeneration.DrawActivityOrder(
    filename,
    order_date,
    endpoint,
    productions,
    timeSlots,
    orders,
    vials,
  )

  return FileResponse(open(filename, 'rb'))
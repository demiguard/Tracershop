""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import date
from pathlib import Path
from logging import getLogger
from traceback import format_tb
import os.path

# Third party Packages
from django.contrib.auth import login
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import FileResponse, HttpResponseNotFound
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# Tracershop Production
from constants import DEBUG_LOGGER, ERROR_LOGGER
from database.models import ActivityOrder, ActivityDeliveryTimeSlot, \
  ActivityProduction, DeliveryEndpoint, OrderStatus, Vial, User, UserGroups,\
  InjectionOrder, UserAssignment, Days
from lib.pdfGeneration import DrawReleaseCertificate, DrawInjectionOrder
from shared_constants import JAVASCRIPT_VERSION
from tracerauth.auth import login_from_header
from tracerauth.ldap import guess_customer_group

debug_logger = getLogger(DEBUG_LOGGER)
error_logger = getLogger(ERROR_LOGGER)

# This is an (almost) single page application
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  success = login_from_header(request)
  if success:
      user = request.user
      if isinstance(user, User):
        if user.user_group in [UserGroups.ShopAdmin, UserGroups.ShopUser]:
          if not UserAssignment.objects.filter(user=user).exists():
            try:
              mStreetAddress, user_assignments = guess_customer_group(user.username)
              if mStreetAddress is not None and len(user_assignments) == 0:
                debug_logger.error(f"Create a notification that {mStreetAddress} doens't map to a customer")
            except Exception as E:
              error_logger.error("Assignment of user group threw an unhandled exception")
              error_logger.error(format_tb(E.__traceback__))
  else:
    debug_logger.info(request.headers)

  return render(request, "frontend/index.html", { 'javascript_file' : f"frontend/main_{JAVASCRIPT_VERSION}.js" })

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
    debug_logger.info("URL parameter point to a none existent day")
    debug_logger.info(f"year: {year}")
    debug_logger.info(f"month: {month}")
    debug_logger.info(f"day: {day}")
    return HttpResponseNotFound(request)

  try:
    endpoint = DeliveryEndpoint.objects.get(pk=endpointID)
  except ObjectDoesNotExist:
    debug_logger.info("URL parameter point to a none existent endpoint")
    debug_logger.info(f"endpointID: {endpointID}")
    return HttpResponseNotFound(request)

  productions = ActivityProduction.objects.filter(tracer__pk=tracerID,
                                                  production_day=order_date.weekday())
  if len(productions) == 0:
    debug_logger.info(f"No productions could be found at {order_date}, which is a {Days(order_date.weekday()).name}")
    return HttpResponseNotFound(request)

  timeSlots = ActivityDeliveryTimeSlot.objects.filter(destination__pk=endpointID,
                                                      production_run__in=productions)
  if len(timeSlots) == 0:
    debug_logger.info(f"No timeslots could be found at {order_date}")
    return HttpResponseNotFound(request)

  orders = ActivityOrder.objects.filter(status=OrderStatus.Released,
                                        ordered_time_slot__in=timeSlots,
                                        delivery_date=order_date,)
  if len(orders) == 0:
    debug_logger.info(f"No released orders could be found at {order_date}")
    return HttpResponseNotFound(request)

  vials = Vial.objects.filter(assigned_to__in=orders)

  if month < 10:
    month_text = f"0{month}"
  else:
    month_text = str(month)

  filename = f"frontend/static/frontend/pdfs/{endpointID}/{tracerID}/{year}/{month_text}/{day}.pdf"
  pathFilename = Path(filename)

  dirPath = Path(os.path.dirname(pathFilename))
  if not dirPath.exists():
    dirPath.mkdir(parents=True, exist_ok=True)

  DrawReleaseCertificate(
    filename,
    order_date,
    endpoint,
    [production for production in productions],
    orders,
    [vial for vial in vials],
  )

  return FileResponse(open(filename, 'rb'))

def pdfInjectionView(request, injection_order_id: int):
  try:
    injection_order = InjectionOrder.objects.get(pk=injection_order_id, status=OrderStatus.Released);
  except ObjectDoesNotExist:
    return HttpResponseNotFound(request)

  filename = f"frontend/static/frontend/pdfs/injection_orders/injection_order_{injection_order_id}.pdf"
  pathFilename = Path(filename)

  dirPath = Path(os.path.dirname(pathFilename))
  if not dirPath.exists(): #pragma: no cover
    dirPath.mkdir(parents=True, exist_ok=True)

  if(pathFilename.exists()): #pragma: no cover
    return FileResponse(open(filename, 'rb'))
  DrawInjectionOrder(filename, injection_order)

  return FileResponse(open(filename, 'rb'))
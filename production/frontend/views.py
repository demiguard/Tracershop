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
from database.database_interface import DatabaseInterface
from lib.formatting import format_csv_data
from lib.pdfGeneration import DrawReleaseCertificate, DrawInjectionOrder
from shared_constants import JAVASCRIPT_VERSION, URL_SHOP_MANUAL
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
            timeSlotID:int,
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
    time_slot = ActivityDeliveryTimeSlot.objects.get(pk=timeSlotID)
  except ObjectDoesNotExist:
    return HttpResponseNotFound(request)

  endpoint = time_slot.destination
  production = time_slot.production_run

  orders = [order for order in ActivityOrder.objects.filter(status=OrderStatus.Released,
                                                            ordered_time_slot=time_slot,
                                                            delivery_date=order_date,
                                                            moved_to_time_slot=None)
                        ] + [order for order in ActivityOrder.objects.filter(
                          status=OrderStatus.Released,
                          delivery_date=order_date,
                          moved_to_time_slot=time_slot
                        )]
  if len(orders) == 0:
    debug_logger.info(f"No released orders could be found at {order_date} and {timeSlotID}")
    return HttpResponseNotFound(request)

  vials = Vial.objects.filter(assigned_to__in=orders)

  if month < 10:
    month_text = f"0{month}"
  else:
    month_text = str(month)

  filename = f"frontend/static/frontend/pdfs/{timeSlotID}/{year}/{month_text}/{day}.pdf"
  pathFilename = Path(filename)

  dirPath = Path(os.path.dirname(pathFilename))
  if not dirPath.exists():
    dirPath.mkdir(parents=True, exist_ok=True)

  DrawReleaseCertificate(
    filename,
    order_date,
    endpoint,
    production,
    orders,
    [vial for vial in vials],
  )

  return FileResponse(open(filename, 'rb'), filename="FrigivelsesDokument.pdf")

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

  return FileResponse(open(filename, 'rb'), filename="FrigivelsesDokument.pdf")

def vial_csv_view(request, year: int, month: int):
  try:
    csv_date = date(year, month, 1)
  except ValueError:
    return HttpResponseNotFound(request)

  database = DatabaseInterface()
  csv_data = database.get_csv_data(csv_date)
  formatted_data = format_csv_data(csv_data)

  return FileResponse(formatted_data, filename="data.xlsx")

def shop_manual_view(request):
  filename = "frontend/static/frontend/pdfs/manuals/shop_manual.pdf"
  return FileResponse(open(filename, 'rb'), filename="Kunde Manual.pdf")
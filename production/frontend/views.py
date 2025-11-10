""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import date
from pathlib import Path
from logging import getLogger
import os.path

# Third party Packages
from django.conf import settings
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import FileResponse, HttpResponseNotFound, HttpResponseForbidden, HttpRequest
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# Tracershop Production
from constants import DEBUG_LOGGER, ERROR_LOGGER
from database.models import ActivityOrder, ActivityDeliveryTimeSlot, \
  OrderStatus, Vial, InjectionOrder, IsotopeDelivery, IsotopeOrder, IsotopeVial
from database.database_interface import DatabaseInterface
from lib.formatting import format_csv_data, format_time_number
from lib.pdf_generation import DrawReleaseCertificate, DrawInjectionOrder, draw_isotope_release_document
from lib.pdf_generation import label
from shared_constants import JAVASCRIPT_VERSION, URL_SHOP_MANUAL
from tracerauth.auth import login_from_header

debug_logger = getLogger(DEBUG_LOGGER)
error_logger = getLogger(ERROR_LOGGER)

# This is an (almost) single page application
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  success = login_from_header(request) # There's login at the page

  if settings.DEBUG:
    debug_logger.info(request.headers)

  return render(request, "frontend/index.html", { 'javascript_file' : f"frontend/main_{JAVASCRIPT_VERSION}.js" })

@ensure_csrf_cookie
def pdfView(request: HttpRequest,
            timeSlotID:int,
            year: int,
            month : int,
            day: int) -> HttpResponseForbidden | HttpResponseNotFound | FileResponse:
  """Generates the release document for an order, and returns the response.
  This view does't cache, as updates to way to much stuff might causes cache
  invalidation.

  Args:
      request (HttpRequest): The django generated user request. The user is logged in.
      timeSlotID (int): The time slot, that user request information about
      year (int): The year the user request a release document for
      month (int): The month the user request a release document for
      day (int): The day the user request a release document for

  Returns:
      FileResponse | HttpResponseForbidden | HttpResponseNotFound :
        returns a File response if the server was able to create a release
        document.
        Returns a forbidden response if the user is not logged in.
        Returns a NotFound if the server is unable to create a release document
        from the args.

  """
  if not request.user:
    return HttpResponseForbidden(request)
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

@ensure_csrf_cookie
def pdfInjectionView(request, injection_order_id: int):
  if not request.user:
    return HttpResponseForbidden(request)
  try:
    injection_order = InjectionOrder.objects.get(pk=injection_order_id, status=OrderStatus.Released);
  except ObjectDoesNotExist:
    return HttpResponseNotFound(request)

  filename = f"frontend/static/frontend/pdfs/injection_orders/injection_order_{injection_order_id}.pdf"
  pathFilename = Path(filename)

  dirPath = Path(os.path.dirname(pathFilename))
  if not dirPath.exists(): #pragma: no cover
    dirPath.mkdir(parents=True, exist_ok=True)

  #if(pathFilename.exists()): #pragma: no cover
  #  return FileResponse(open(filename, 'rb'))
  DrawInjectionOrder(filename, injection_order)

  return FileResponse(open(filename, 'rb'), filename="FrigivelsesDokument.pdf")

def vial_csv_view(request, year: int, month: int):
  if not request.user:
    return HttpResponseForbidden(request)

  try:
    csv_date = date(year, month, 1)
  except ValueError:
    return HttpResponseNotFound(request)

  database = DatabaseInterface()
  csv_data = database.get_csv_data(csv_date)
  formatted_data = format_csv_data(csv_data)

  return FileResponse(formatted_data, filename=f"tracershop_data-{year}-{format_time_number(month)}.xlsx")

@ensure_csrf_cookie
def release_isotope_document(request : HttpRequest,
                             delivery_id: int,
                             year: int,
                             month: int,
                             day: int
                             ):
  try:
    delivery = IsotopeDelivery.objects.get(pk=delivery_id)
  except ObjectDoesNotExist:
    return HttpResponseNotFound(request)

  try:
    requested_date = date(year, month, day)
  except ValueError:
    return HttpResponseNotFound(request)

  isotope_orders = [ io for io in IsotopeOrder.objects.filter(
    destination=delivery,
    delivery_date=requested_date,
    status=OrderStatus.Released
  )]

  if len(isotope_orders) == 0:
    return HttpResponseNotFound(request)

  vials = [ iv for iv in IsotopeVial.objects.filter(
    delivery_with__in=isotope_orders
  )]

  if len(vials) == 0:
    return HttpResponseNotFound(request)


  filename = f"frontend/static/frontend/pdfs/isotope/{delivery_id}/{year}/{month}/{day}.pdf"
  pathFilename = Path(filename)
  dirPath = Path(os.path.dirname(pathFilename))
  if not dirPath.exists():
    dirPath.mkdir(parents=True, exist_ok=True)

  draw_isotope_release_document(
    filename,
    delivery,
    isotope_orders,
    vials
  )

  return FileResponse(open(filename, 'rb'),filename="isotope_frigivelse.pdf")


@ensure_csrf_cookie
def shop_manual_view(request):
  filename = "frontend/static/frontend/pdfs/manuals/shop_manual.pdf"
  return FileResponse(open(filename, 'rb'), filename="Kunde Manual.pdf")

@ensure_csrf_cookie
def vial_label_pdf(request: HttpRequest, vial_id : int):
  try:
    vial = Vial.objects.get(pk=vial_id)
  except ObjectDoesNotExist:
    return HttpResponseNotFound(request)

  filename = f"frontend/static/frontend/pdfs/vial_labels"
  file_path = Path(filename)

  if not file_path.parent.exists():
    file_path.parent.mkdir(parents=True, exist_ok=True)

  label.VialLabel(filename, vial)

  #label.get_label_post_script(filename, vial)

  return FileResponse(open(filename, 'rb'), filename=f"label-{vial.id}.pdf")
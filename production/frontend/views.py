""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import date
from pathlib import Path

# Third party Packages
from django.contrib.auth import login
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import FileResponse, HttpResponseNotFound
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django_auth_ldap.backend import LDAPBackend

# Tracershop Production
from lib import pdfGeneration
from database.models import ActivityOrder, ActivityDeliveryTimeSlot, ActivityProduction, DeliveryEndpoint, OrderStatus, Vial, User, UserGroups
from tracerauth.backend import TracershopAuthenticationBackend

# This is an (almost) single page application
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  if 'X-Tracer-User' in request.headers and 'X-Tracer-Role' in request.headers:
    try:
      user = User.objects.get(username=request.headers['X-Tracer-User'])
      if user.UserGroup != request.headers['X-Tracer-Role']:
        user.UserGroup = UserGroups(request.headers['X-Tracer-Role'])
        user.save()
    except ObjectDoesNotExist:
      user = User.objects.create(username=request.headers['X-Tracer-User'],
                          UserGroup=UserGroups(request.headers['X-Tracer-Role']))
    if user.UserGroup == UserGroups.ShopExternal:
      backend = "tracerauth.backend.TracershopAuthenticationBackend"
    else:
      backend = "django_auth_ldap.backend.LDAPBackend"

    login(request, user, backend=backend)

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
    [production for production in productions],
    orders,
    vials,
  )

  return FileResponse(open(filename, 'rb'))
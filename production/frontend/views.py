from http.client import HTTPResponse
from django.http import FileResponse
from django.shortcuts import render
from django.http import HttpResponseNotFound
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import PermissionDenied
from database.models import UserGroups

from pathlib import Path

from lib.SQL.SQLController import SQL
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, IsotopeDataClass, TracerDataClass, VialDataClass
from lib import pdfGeneration
from lib.utils import LMAP

# This is an (almost) single page appilication
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")

def pdfView(request, customer:str, year: int, month : int, ID):
  if request.user.UserGroup not in [UserGroups.Admin, UserGroups.ProductionAdmin, UserGroups.ProductionUser]:
    raise PermissionDenied

  if month < 10:
    month = f"0{month}"
  else:
    month = str(month)

  filename = f"frontend/static/frontend/pdfs/{customer}/{year}/{month}/{ID}.pdf"

  if not Path(filename).exists():
    Order = SQL.getElement(ID, ActivityOrderDataClass)
    if Order == None:
      return HttpResponseNotFound
    Customer = SQL.getElement(Order.BID, CustomerDataClass)
    RelatedOrders = SQL.getConditionalElements(f"COID={ID}", ActivityOrderDataClass)
    oids = [Order.oid]
    for RelatedOrder in RelatedOrders:
      oids.append(RelatedOrder.oid)

    oidsstr = ", ".join(LMAP(str, oids))

    Vials = SQL.getConditionalElements(f"order_id IN ({oidsstr})", VialDataClass)
    Tracer = SQL.getElement(Order.tracer, TracerDataClass)
    Isotope = SQL.getElement(Tracer.isotope, IsotopeDataClass)

    pdfGeneration.DrawSimpleActivityOrder(filename, Customer, Order, Vials, Tracer, Isotope)

  return FileResponse(open(filename, 'rb'))
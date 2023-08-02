""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from pathlib import Path

# Third party Packages
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponseNotFound
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# Tracershop Production
from database.models import UserGroups

# This is an (almost) single page application
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")

def pdfView(request, customer:str, year: int, month : int, ID):
  if month < 10:
    month_text = f"0{month}"
  else:
    month_text = str(month)

  filename = f"frontend/static/frontend/pdfs/{customer}/{year}/{month_text}/{ID}.pdf"

  
  """  if not Path(filename).exists():
    Order = SQL.getElement(ID, ActivityOrderDataClass)
    if Order == None:
      return HttpResponseNotFound
    Customer = SQL.getElement(Order.BID, CustomerDataClass)
    RelatedOrders = SQL.getConditionalElements(f"COID={ID}", ActivityOrderDataClass)
    oids = [Order.oid]
    for RelatedOrder in RelatedOrders:
      oids.append(RelatedOrder.oid)

    oidsStr = ", ".join([str(oid) for oid in oids])

    Vials = SQL.getConditionalElements(f"order_id IN ({oidsStr})", VialDataClass)
    Tracer = SQL.getElement(Order.tracer, TracerDataClass)
    Isotope = SQL.getElement(Tracer.isotope, IsotopeDataClass)

    pdfGeneration.DrawSimpleActivityOrder(filename, Customer, Order, Vials, Tracer, Isotope)

  return FileResponse(open(filename, 'rb'))

  """
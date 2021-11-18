from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import date, timedelta

from lib.SQL import SQLController
from lib.utils import LMAP

from constants import JSON_VIALS, JSON_VIAL_MAPPING

class APIGetVials(View):
  """
    This endpoint is responsible for retriving vials from a specific day
  """
  name = "APIgetVials"
  path = "getVials/<int:year>/<int:month>/<int:day>"

  def get(self, request, year: int, month: int, day: int):

    try:
      requestDate = date(year, month, day) # Start using date instead of some fancy string manipulation since this catches some exceptions
    except ValueError:
      return HttpResponseBadRequest()

    Vials = SQLController.getVials(requestDate)
    OrderRelations = SQLController.getOrderRelationsByDate(requestDate)

    return JsonResponse({
      JSON_VIALS : Vials,
      JSON_VIAL_MAPPING : OrderRelations
    })
    
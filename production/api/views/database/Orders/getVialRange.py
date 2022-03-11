from django.views.generic import View
from django.http import HttpResponseBadRequest

from datetime import date, timedelta

from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController
from lib.utils import LMAP

from constants import JSON_VIALS, JSON_CUSTOMERS

HISTORIC_RANGE = 7


class APIGetVialRange(View):
  """
    This endpoint is responsible for getting daily vials, and not historic vials. 
    The idea here is in the common use case we do not need historic vials. 
    So if a user needs it they can use another endpoint.
    This endpoint also have additional information such as the different users availble.

    One could start to think if one should inject the basic data into the site so they don't get it from every endpoint
  """

  path = "getVialRange"
  name = "APIgetVialRange"

  def get(self, request):
    today = date.today()
    historic_date = today - timedelta(days=HISTORIC_RANGE)
    Vials = self.SQL.getVialRange(historic_date, today)

    customers = self.SQL.getCustomers()

    return ProductionJSONResponse({
      JSON_VIALS : Vials,
      JSON_CUSTOMERS : customers
    })

  def __init__(self, SQL=SQLController.SQL()):
    self.SQL = SQL
    
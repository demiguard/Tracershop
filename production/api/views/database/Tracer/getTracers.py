from django.views.generic import View
from django.http import HttpResponseBadRequest

from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL.SQLController import SQL
from lib.utils import LMAP

from constants import JSON_TRACER, JSON_ISOTOPE

class APIGetTracers(View):
  name = "gettracers"
  path = "gettracers"

  def get(self, request):

    tracers = self.SQL.getTracers()
    isotopes = self.SQL.getIsotopes()

    return ProductionJSONResponse({
      JSON_TRACER  : tracers,
      JSON_ISOTOPE : isotopes
    })

  def __init__(self, SQL_Controller=SQL()):
    self.SQL = SQL_Controller
    super().__init__()
  
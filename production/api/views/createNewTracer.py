from django.views.generic import View

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController

from constants import JSON_TRACER

class APICreateNewTracer(View):
  name = "createNewTracer"
  path = "createNewTracer"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    name         = data["newTracerName"]
    isotope      = data["newIsotope"]
    n_injections = data["newInjections"]
    order_block  = data["newOrderBlock"]


    return ProductionJSONResponse({
      JSON_TRACER : SQLController.createNewTracer(name, isotope, n_injections, order_block)
    })
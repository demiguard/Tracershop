from django.views.generic import View
from django.http import HttpResponseBadRequest

from lib import Formatting
from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController

from constants import JSON_TRACER_MAPPING

class APIGetTracerCustomer(View):
  """
    This endpoint is responsible for getting mapping between the which
    tracers each customer is allowed to order.
  """

  name = "getTracerCustomerMapping"
  path = "getTracerCustomerMapping"

  def get(self,request):
    return ProductionJSONResponse({
      JSON_TRACER_MAPPING : SQLController.getTracerCustomerMapping()
    })

from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

from constants import JSON_TRACER_MAPPING

class APIGetTracerCustomer(View):
  """
    This endpoint is responsible for getting mapping between the which
    tracers each customer is allowed to order.
  """

  name = "getTracerCustomerMapping"
  path = "getTracerCustomerMapping"

  def get(self,request):
    return JsonResponse({
      JSON_TRACER_MAPPING : SQLController.getTracerCustomerMapping()
    })

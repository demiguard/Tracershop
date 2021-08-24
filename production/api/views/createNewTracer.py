from django.views.generic import View
from django.http import JsonResponse

from lib.SQL import SQLController
from lib import Formatting

class ApicreateNewTracer(View):
  name = "createNewTracer"
  path = "createNewTracer"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    name         = data["newTracerName"]
    isotope      = data["newIsotope"]
    n_injections = data["newInjections"]
    order_block  = data["newOrderBlock"]


    return JsonResponse({
      "tracers" : SQLController.createNewTracer(name, isotope, n_injections, order_block)
    })
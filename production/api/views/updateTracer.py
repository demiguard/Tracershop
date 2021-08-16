from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib import Formatting

class APIUpdateTracer(View):
  name = "updateTracer"
  path = "updateTracer"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    SQLController.updateTracer(
      data["tracer"],
      data["key"],
      data["newValue"] 
    )

    return JsonResponse({

    })

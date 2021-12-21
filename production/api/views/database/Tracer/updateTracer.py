from django.views.generic import View
from django.http import HttpResponse, HttpResponseBadRequest

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

    return HttpResponse(status=204)

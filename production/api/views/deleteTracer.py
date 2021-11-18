from django.views.generic import View
from django.http import JsonResponse

from lib.SQL import SQLController
from lib import Formatting

class APIDeleteTracer(View):
  name = "deleteTracer"
  path = "deleteTracer"

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    SQLController.deleteTracer(data["tracerID"])

    return JsonResponse({})
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from api.lib.SQL import SQLController
from api.utils import LMAP

class ApiGetTracers(View):
  name = "gettracers"
  path = "gettracers"

  def get(self, request):

    tracers = SQLController.getTracers()
    isotopes = SQLController.getIsotopes()

    return JsonResponse({
      "tracer" : tracers,
      "isotope" : isotopes
    })
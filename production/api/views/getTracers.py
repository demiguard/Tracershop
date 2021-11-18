from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib.utils import LMAP

from constants import JSON_TRACER, JSON_ISOTOPE

class APIGetTracers(View):
  name = "gettracers"
  path = "gettracers"

  def get(self, request):

    tracers = SQLController.getTracers()
    isotopes = SQLController.getIsotopes()

    return JsonResponse({
      JSON_TRACER  : tracers,
      JSON_ISOTOPE : isotopes
    })

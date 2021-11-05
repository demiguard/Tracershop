from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib.SQL import SQLController
from lib.utils import LMAP

class ApigetVialInfo(View):
  path = getVialInfo
  name = APIgetVialInfo

  def get(self, request):
    pass
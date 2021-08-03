from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from lib import Formatting
from lib.SQL import SQLController
from lib.utils import LMAP

class ApiDeliverTimes(View):
  name = "delivertimes"
  path = "delivertimes"

  def get(self, request):
    data = Formatting.ParseJSONRequest(request)

    print(data)
    
    return JsonResponse({})

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    print(data)

    return JsonResponse({}) 

  def put(self, request):
    return JsonResponse({})

  def delete(self, request):
    return JsonResponse({})
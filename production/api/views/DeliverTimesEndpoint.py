from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse

from lib import Formatting
from lib.SQL import SQLController
from lib.utils import LMAP

class APIDeliverTimes(View):
  name = "delivertimes"
  path = "delivertimes"

  def get(self, request):
    data = Formatting.ParseJSONRequest(request)

    raise NotImplemented

    return JsonResponse({})

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    MaxFDG = data["max"]
    run    = data["run"]
    dtime  = data["dtime"]    
    repeat = data["repeat"]
    day    = data["day"]
    customer = data["customer"]
    
    newID = SQLController.createDeliverTime(
      run, MaxFDG, dtime, repeat, day, customer
    )


    return JsonResponse({"newID" : newID}) 

  def put(self, request):
    data = Formatting.ParseJSONRequest(request)

    MaxFDG = data["max"]
    run    = data["run"]
    dtime  = data["dtime"]    
    repeat = data["repeat"]
    day    = data["day"]
    DTID   = data["DTID"]

    SQLController.updateDeliverTime(MaxFDG, run, dtime, repeat, day, DTID)


    return HttpResponse(status=204)

  def delete(self, request):
    data = Formatting.ParseJSONRequest(request)

    SQLController.deleteDeliverTime(data["DTID"])
    
    return HttpResponse(status=204)

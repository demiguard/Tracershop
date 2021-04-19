from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest


from datetime import datetime, date


from customer import constants
from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer.models import Location


LocationIDKeyWord = "LocationID"
LocationLocNaneKeyWord = "newLocationName"


def typeCorrectData(JSONObject):
  return JSONObject

def EditLocation(NewLocationData):
  loc = Location.objects.get(location=NewLocationData[LocationIDKeyWord])
  #This is for error handling, At some point 
  #try:
  #except:
  #  return None
  
  loc.LocName = NewLocationData[LocationLocNaneKeyWord]
  loc.save()


class ApiEditLocation(LoginRequiredMixin, View):
  path = "api/updateLocations"
  name = "APIEditLocations"

  def put(self, request):    
    StringData = ParseJSONRequest(request)
    data = typeCorrectData(StringData)
    EditLocation(data)

    return constants.SUCCESSFUL_JSON_RESPONSE
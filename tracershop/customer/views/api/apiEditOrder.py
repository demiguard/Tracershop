from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest


from datetime import datetime, date


from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer import constants

def typeCorrectData(JSONObject):
  JSONObject['OrderID'] = int(JSONObject['OrderID'])
  JSONObject['NewAmount'] = int(JSONObject['NewAmount'])
  return JSONObject


class ApiEditOrder(LoginRequiredMixin, View):
  path = "api/EditOrder"
  name = "APIEditOrder"

  def put(self, request):    
    StringData = ParseJSONRequest(request)
    data = typeCorrectData(StringData)
    

    return constants.SUCCESSFUL_JSON_RESPONSE


  def delete(self, request):
    return constants.SUCCESSFUL_JSON_RESPONSE
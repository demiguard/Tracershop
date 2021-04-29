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
  JSONObject['ActiveCustomer'] = int(JSONObject['ActiveCustomer'])
  return JSONObject

def typeCorrectDataDelete(JSONObject):
  
  return int(JSONObject['OrderID'])

class ApiEditOrder(LoginRequiredMixin, View):
  path = "api/EditOrder"
  name = "APIEditOrder"

  def put(self, request):    
    StringData = ParseJSONRequest(request)
    data = typeCorrectData(StringData)
    SQL.updateFDGOrder(
      data['OrderID'], 
      data['NewAmount'],
      data['NewComment'],
      data['ActiveCustomer']
    )

    return constants.SUCCESSFUL_JSON_RESPONSE


  def delete(self, request):
    StringData = ParseJSONRequest(request)
    ID = typeCorrectDataDelete
    SQL.deleteFDGOrder(ID)
    return constants.SUCCESSFUL_JSON_RESPONSE
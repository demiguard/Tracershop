from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest


from datetime import datetime, date


from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer import constants

def typeCorrectData(JSONObject):
  JSONObject['OrderID']        = int(JSONObject['OrderID'])
  JSONObject['ActiveCustomer'] = int(JSONObject['ActiveCustomer'])
  JSONObject['n_injections']   = int(JSONObject['n_injections'])
  Hour, Minute                 = str(JSONObject['orderTime']).split(":")
  JSONObject['NewHour']        = datetime.time(int(Hour), int(Minute))
  return JSONObject

def typeCorrectDataDelete(JSONObject):  
  return int(JSONObject['OrderID'])


class ApiEditTOrder(LoginRequiredMixin, View):
  path = "api/EditTOrder"
  name = "APIEditTOrder"

  def put(self, request):
    JsonData = ParseJSONRequest(request)
    data = typeCorrectData(JsonData)
    status , order_DateTime = SQL.getTOrderStatusOrderTime(data['OrderID'])
    if status != 1:
      return JsonResponse({"Success": "Order does not have a Status of 1"})
    NewInjections = data['n_injections']
    NewOrderTime  = datetime.datetime(
      order_DateTime.year,
      order_DateTime.month,
      order_DateTime.day,
      JsonData["NewHour"].hour,
      JsonData["NewHour"].minute
    )
    NewComment = JsonData["NewComment"]
    NewUse     = JsonData["NewUse"]

    print(NewInjections, NewOrderTime, NewComment, NewUse)

    return constants.SUCCESSFUL_JSON_RESPONSE

  def delete(self, request):
    JsonData = ParseJSONRequest(request)
    ID = typeCorrectDataDelete(JsonData)
    SQL.deleteTOrder(ID)
    return constants.SUCCESSFUL_JSON_RESPONSE



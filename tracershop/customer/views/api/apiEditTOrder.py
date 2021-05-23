from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest


from datetime import datetime, date, time


from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer import constants

def mapUsage(usage):
  UsageMapping = ["Human", "Dyr", "Andet"]
  return UsageMapping[usage]

def typeCorrectData(JSONObject):
  returnObject = {}
  returnObject['OrderID']           = int(JSONObject['OrderID'])
  returnObject['n_injections']      = int(JSONObject['n_injections'])
  Hour, Minute                      = str(JSONObject['NewHour']).split(":")
  returnObject['NewUse']            = mapUsage(int(JSONObject["NewUse"]))
  returnObject['NewHour']           = time(int(Hour), int(Minute))
  returnObject['NewComment']        = JSONObject["NewComment"]
  returnObject['NewActiveCustomer'] = int(JSONObject["NewActiveCustomer"])
  return returnObject

def typeCorrectDataDelete(JSONObject):  
  return int(JSONObject['OrderID'])


class ApiEditTOrder(LoginRequiredMixin, View):
  path = "api/EditTOrder"
  name = "APIEditTOrder"

  def put(self, request):
    JsonData = ParseJSONRequest(request)
    data = typeCorrectData(JsonData)
    status, order_DateTime = SQL.getTOrderStatusOrderTime(data['OrderID'])
    if status != 1:
      return JsonResponse({"Success": "Order does not have a Status of 1"})
    OrderID = data["OrderID"]
    NewActiveCustomer = data["NewActiveCustomer"]
    NewInjections = data['n_injections']
    NewOrderTime  = datetime(
      order_DateTime.year,
      order_DateTime.month,
      order_DateTime.day,
      data["NewHour"].hour,
      data["NewHour"].minute
    )
    NewUse = data["NewUse"]
    NewComment = data["NewComment"]

    SQL.updateTOrder(
      OrderID,
      NewActiveCustomer,
      NewComment,
      NewInjections,
      NewOrderTime,
      NewUse
    )
    

    return constants.SUCCESSFUL_JSON_RESPONSE

  def delete(self, request):
    JsonData = ParseJSONRequest(request)
    ID = typeCorrectDataDelete(JsonData)
    SQL.deleteTOrder(ID)
    return constants.SUCCESSFUL_JSON_RESPONSE



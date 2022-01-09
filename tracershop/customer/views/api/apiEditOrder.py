from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest


from datetime import datetime, date

from customer.lib.orders import isOrderFDGAvailalbeForDate
from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer import constants

def typeCorrectData(JSONObject):
  JSONObject['OrderID'] = int(JSONObject['OrderID'])
  JSONObject['NewAmount'] = int(JSONObject['NewAmount'])
  JSONObject['ActiveCustomer'] = int(JSONObject['ActiveCustomer'])
  if not JSONObject.get("NewComment"):
    JSONObject["NewComment"] = ""
  JSONObject["Date"] = datetime.strptime(JSONObject["Date"], "Dato:%d/%m/%Y") 

  


  return JSONObject

def typeCorrectDataDelete(JSONObject):  
  return int(JSONObject['OrderID'])

class ApiEditOrder(LoginRequiredMixin, View):
  path = "api/EditOrder"
  name = "APIEditOrder"

  def put(self, request):    
    StringData = ParseJSONRequest(request)
    data = typeCorrectData(StringData)
    
    monthlyCloseDates = SQL.monthlyCloseDates(data["Date"].year, data["Date"].month)  
    if not isOrderFDGAvailalbeForDate(data["Date"], monthlyCloseDates, [0,1,2,3,4,5,6,7]):
      return JsonResponse({
        "Success" : "InvalidDate"
      })


    SQL.updateFDGOrder(
      data['OrderID'], 
      data['NewAmount'],
      data['NewComment'],
      data['ActiveCustomer']
    )
    overhead = SQL.getCustomerOverhead(data['ActiveCustomer'])

    return JsonResponse({
      "Success" : "Success",
      "overhead" : overhead
    })


  def delete(self, request):
    Data = ParseJSONRequest(request)
    ID = typeCorrectDataDelete(Data)
    Data["Date"] = datetime.strptime(Data["Date"], "Dato:%d/%m/%Y") 
    monthlyCloseDates = SQL.monthlyCloseDates(Data["Date"].year, Data["Date"].month)  
    print(Data["Date"])
    if not isOrderFDGAvailalbeForDate(Data["Date"], monthlyCloseDates, [0,1,2,3,4,5,6,7]):
      
      
      return JsonResponse({
        "Success" : "InvalidDate"
      })



    SQL.deleteFDGOrder(ID)
    return constants.SUCCESSFUL_JSON_RESPONSE
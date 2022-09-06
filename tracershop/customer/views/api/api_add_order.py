from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL


class Api_add_order(LoginRequiredMixin, View):
  path = "api/addOrder"
  name = "APIAddOrder"

  def parse_QueryDict(self, Dict):
    tempdate = datetime.strptime(Dict['dato'], '%d/%m/%Y')
    return {
      'order'  : int(Dict['order']) - 1,
      'amount' : int(Dict['amount']),
      'dato':  date(tempdate.year, tempdate.month, tempdate.day),
      'comment' : Dict['comment'],
      'customerID'  : Dict['customerID']
    }

  def post(self, request):


    try:
      FormatedDict = self.parse_QueryDict(request.POST)
    except ValueError as E:
      print(f"Value Error: {E}\n Input was {request.POST}")
      return JsonResponse({
        'successRate' : 'FAIL',
        'failMessage' : 'Invaild Inputs'
      })
    except KeyError as E:
      print(f"Key Error: {E}")
      return JsonResponse({
        'successRate' : 'FAIL',
        'failMessage' : 'Missing Inputs'
      })
    # Check for late ordering


    #Remember there's a selection here
    deliverTimeDict = SQL.getDailyRuns(FormatedDict['dato'], FormatedDict['customerID'])
    SelectdeliverTime = deliverTimeDict[FormatedDict['order']]
    deliverTime      = SelectdeliverTime['dtime']

    run = FormatedDict['order'] + 1
    SQL.insertOrderFTG(
        FormatedDict['amount'],     # amount
        FormatedDict['comment'],    # comment
        deliverTime,                # deliverTime
        FormatedDict['dato'],       # dato
        run,                        # run
        FormatedDict['customerID'], # UserID
        request.user.username       # userName
      )
    #Note rare Race condition
    lastOID = SQL.getLastOrder()
    overhead = SQL.getCustomerOverhead(FormatedDict['customerID'])


    return JsonResponse({
      'successRate' : "Success",
      'lastOrder'   : lastOID,
      'amount'      : FormatedDict['amount'],
      'overhead'    : overhead
    })

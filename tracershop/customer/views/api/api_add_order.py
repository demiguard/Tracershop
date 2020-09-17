from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL


class Api_add_order(LoginRequiredMixin, TemplateView):
  def parse_QueryDict(self, Dict):
    tempdate = datetime.strptime(Dict['dato'], '%d/%m/%Y')
    
    return {
      'order'  : int(Dict['order']) - 1,
      'amount' : int(Dict['amount']),
      'dato':  date(tempdate.year, tempdate.month, tempdate.day),
      'comment' : Dict['comment']
    }

  def post(self, request):
    try:
      FormatedDict = self.parse_QueryDict(request.POST)
    except ValueError as E:
      print(E)
      return JsonResponse({
        'successRate' : 'FAIL',
        'failMessage' : 'Invaild Inputs'
      })
    except KeyError as E:
      print(E)
      return JsonResponse({
        'successRate' : 'FAIL',
        'failMessage' : 'Missing Inputs'
      })

    userID = 7
    #Remember there's a selection here
    deliverTimeDict = SQL.getDailyRuns(FormatedDict['dato'], userID)[FormatedDict['order']]
    deliverTime      = deliverTimeDict['dtime']
    SQL.insertOrderFTG(
        FormatedDict['amount'],
        deliverTime,
        FormatedDict['dato'],
        FormatedDict['comment'],
        userID
      )
    #Note rare Race condition
    lastOID = SQL.getLastOrder()

    return JsonResponse({
      'successRate' : "Success",
      'lastOrder'   : lastOID,
      'amount'      : FormatedDict['amount'],
    })

    
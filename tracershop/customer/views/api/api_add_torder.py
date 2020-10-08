from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL

class Api_add_torder(LoginRequiredMixin, TemplateView):
  def __init__(self):
    self.QDICTTracerID = 'id'
    self.QDICTDato = 'dato'
    self.QDICTTime = 'BestillingTid'
    self.QDICTInjections = 'injections'
    self.QDICTUsage = 'Usage'

    self.FDICTInjections = 'injections'
    self.FDICTTracerID = 'tracer'
    self.FDICTUsage = 'Usage'
    self.FDICTDateTime = 'Datetime'

  def parseDict(self,QDict):
    print(QDict)
    
    if QDict[self.QDICTUsage] == '0':
      usage = 'Human'
    elif QDict[self.QDICTUsage] == '1':
      usage = 'Dyr'
    elif QDict[self.QDICTUsage] == '2':
      usage = 'Andet'

    return {
      self.FDICTInjections : int(QDict[self.QDICTInjections]),
      self.FDICTTracerID : int(QDict[self.QDICTTraderID]),
      self.FDICTDateTime : datetime.datetime.strptime(
        QDict[self.QDICTTime]+" "+QDict[self.QDICTDato],
        "%H:%M %d/%m/%Y" 
      ),
      self.FDICTUsage : usage
    }

  def post(self, request): 
    try:
      FormattedDict = self.parseDict(request.POST)
    except:
      return JsonResponse({
        'successRate': "FAIL",
        'failMessage': "SUP"
      })

    
    UserID = 7

    SQL.insertTOrder(
      FormattedDict[self.FDICTInjections],
      FormattedDict[self.FDICTDateTime],
      FormattedDict[self.FDICTtracerID],
      FormattedDict[self.FDICTUsage],
      UserID
      )


    return JsonResponse({
      'lastOID' : SQL.getLastTOrder()
    })
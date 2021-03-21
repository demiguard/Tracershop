from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL

class Api_add_torder(LoginRequiredMixin, View):
  name = "APIAddTorder"
  path = "api/addTOrder"

  #Constants
  QDICTTracerID = 'id'
  QDICTDato = 'dato'
  QDICTTime = 'BestillingTid'
  QDICTInjections = 'injections'
  QDICTUsage = 'Usage'
  QDICTCustomerID = "customerID"

  FDICTInjections = 'injections'
  FDICTTracerID = 'tracer'
  FDICTUsage = 'Usage'
  FDICTDateTime = 'Datetime'
  FDICTUserID = "customerID"

  def parseDict(self,QDict):
    if QDict[self.QDICTUsage] == '0':
      usage = 'Human'
    elif QDict[self.QDICTUsage] == '1':
      usage = 'Dyr'
    elif QDict[self.QDICTUsage] == '2':
      usage = 'Andet'

    return {
      self.FDICTInjections : int(QDict[self.QDICTInjections]),
      self.FDICTTracerID : int(QDict[self.QDICTTracerID]),
      self.FDICTDateTime : datetime.strptime(
        QDict[self.QDICTTime]+" "+QDict[self.QDICTDato],
        "%H:%M %d/%m/%Y" 
      ),
      self.FDICTUsage : usage,
      self.FDICTUserID : int(QDict[self.QDICTCustomerID])
    }

  def post(self, request): 
    try:
      FormattedDict = self.parseDict(request.POST)
    except Exception as E:
      return JsonResponse({
        'successRate': "FAIL",
        'failMessage': "SUP"
      })

    
    

    SQL.insertTOrder(
      FormattedDict[self.FDICTInjections],
      FormattedDict[self.FDICTDateTime],
      FormattedDict[self.FDICTTracerID],
      FormattedDict[self.FDICTUsage],
      FormattedDict[self.FDICTUserID],
      request.user.username
      )


    return JsonResponse({
      'lastOID' : SQL.getLastTOrder()
    })
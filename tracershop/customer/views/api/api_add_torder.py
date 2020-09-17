from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL

class Api_add_torder(LoginRequiredMixin, TemplateView):
  def parseDict(self,QDict):
    
    
    return {
      
    }

  def post(self, request): 
    try:
      FormattedDict = self.parseDict(request.POST)
    except:
      return JsonResponse({
        'successRate': "FAIL",
        'failMessage': "SUP"
      })

    

    return JsonResponse({
      'lastOID' : SQL.getLastTOrder()
    })
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import datetime, date

from customer.lib.SQL import SQLController as SQL
from customer import constants

class ApiEditOrder(LoginRequiredMixin, View):
  path = "api/EditOrder"
  name = "APIEditOrder"

  def put(self, request):    
    return constants.SUCCESSFUL_JSON_RESPONSE


  def delete(self, request):
    return constants.SUCCESSFUL_JSON_RESPONSE
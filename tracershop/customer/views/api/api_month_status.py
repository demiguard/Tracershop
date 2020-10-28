from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse

from customer.lib.SQL import SQLController as SQL

class Api_month_status(View):
  name = "APIMonthStatus"
  path = "api/month_status/<int:year>/<int:month>"
  def get(self, request, year, month):
    
    userID = request.GET['userID']
    data = SQL.queryOrderByMonth(year, month, userID)
    return JsonResponse(data)    

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse

from customer.lib import orders
from customer.lib.SQL import SQLController as SQL

class ApiMonthStatus(View):
  name = "APIMonthStatus"
  path = "api/monthStatus/<int:year>/<int:month>"
  def get(self, request, year, month):
    
    userID = request.GET['userID']
    MergedOrders = orders.getMonthlyOrders(year, month, userID)
    
    return JsonResponse(MergedOrders)    

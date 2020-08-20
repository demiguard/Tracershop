from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView, View
from django.http import JsonResponse

from customer.lib import sqlCurator as sql

class Api_month_status(View):
  def get(self, request, year, month):
    data = sql.query_order_by_month(year, month, 7)
    data = dict(map(lambda x: (str(x[0]), x[1]), data))

    print(data)

    return JsonResponse(data)    

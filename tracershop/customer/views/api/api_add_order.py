from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render

from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib import sqlCurator as sql


class Api_add_order(LoginRequiredMixin, TemplateView):
  def parse_QueryDict(self, Dict):

    return {}

  def post(self, request):

    


    return JsonResponse({})

    
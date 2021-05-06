from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.lib.Formatting import convertTruthValuesFromJS
from customer.models import User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

from customer.lib.SQL import  SQLController as SQL


class ApiAdminUpdateRights(AdminRequiredMixin, LoginRequiredMixin, View):
  name = "ApiAdminUpdateRights"
  path = "admin/api/updateRights"

  def get(self, request):
    for userID, right in request.GET.items():
      tempUser = SQL.getSpecificObject(userID, User)
      tempUser.is_admin = convertTruthValuesFromJS(right)
      tempUser.save()


    return JsonResponse({})

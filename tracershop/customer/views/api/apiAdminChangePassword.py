from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.models import User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin
from customer.lib.SQL import SQLController as SQL


class ApiAdminChangePassword(AdminRequiredMixin, LoginRequiredMixin, View):
  name = "ApiAdminChangePassword"
  path = "myadmin/api/updatepw"

  def get(self, request):
    passwordChangingUser = SQL.getSpecificObject(request.GET['userID'], User)
    passwordChangingUser.set_password(request.GET['newPassword'])
    passwordChangingUser.save()

    return JsonResponse({})

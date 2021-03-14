from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from customer.models import User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin



class ApiAdminChangePassword(AdminRequiredMixin, LoginRequiredMixin, View):
  name = "ApiAdminChangePassword"
  path = "api/admin/updatepw"

  def get(self, request):
    passwordChangingUser = User.objects.get(id=request.GET['userID'])
    passwordChangingUser.set_password(request.GET['newPassword'])
    passwordChangingUser.save()

    return JsonResponse({})

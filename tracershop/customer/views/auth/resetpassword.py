from django.shortcuts import render, redirect, Http404
from django.views.generic import TemplateView
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from customer.lib.Formatting import ParseJSONRequest
from customer.models import ResetPassword, User
from customer.constants import SUCCESSFUL_JSON_RESPONSE

import datetime


class ResetPasswordView(TemplateView):
  template_name = 'customer/auth/resetPassword.html'
  name = "resetPassword"
  path = "resetPassword/<uuid:Reference>"


  def get(self, request, Reference):
    try:
      ResetPasswordRequest = ResetPassword.objects.get(Reference=str(Reference).replace('-',''))
    except ObjectDoesNotExist:
      return Http404

    now = datetime.datetime.now()

    if ResetPasswordRequest.expire < now:
      ResetPasswordRequest.delete()
      return Http404


    context = {
      "Request" :  ResetPasswordRequest
    }

    return render(request, self.template_name, context)

  def put(self, request, Reference):
    try:
      ResetPasswordRequest = ResetPassword.objects.get(Reference=Reference)
    except ObjectDoesNotExist:
      return Http404()

    now = datetime.datetime.now()

    if ResetPasswordRequest.expire < now:
      ResetPasswordRequest.delete()
      return Http404()

    NewData = ParseJSONRequest(request)
    userInstance = ResetPasswordRequest.UserID
    userInstance.set_password(NewData['NewPassword'])
    userInstance.save()

    ResetPasswordRequest.delete()

    return SUCCESSFUL_JSON_RESPONSE



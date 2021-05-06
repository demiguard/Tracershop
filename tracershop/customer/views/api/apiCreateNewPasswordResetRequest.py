from django.shortcuts import render
from django.views.generic import View
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse, HttpResponseBadRequest

import uuid
from datetime import datetime, date, timedelta

from customer.models import User, ResetPassword
from customer.lib import tracershopSMTP
from customer.lib.SQL import SQLController as SQL


class APICreateNewPasswordResetRequest(View):
  name = "APICreateNewPasswordResetRequest"
  path = "api/CreateNewPasswordResetRequest"


  def post(self, request):

    try:
      UserInQuestion = User.objects.get(username=)
    except ObjectDoesNotExist:
      return JsonResponse({
        "Success" : "User does not exists"
      })

    expireTime = datetime.now() + timedelta(hours=1)
    UUID = uuid.uuid4()

    PWrequest = ResetPassword(
      expire=expireTime,
      UserID = UserInQuestion
      Reference = UUID
    )

    PWrequest.save()

    tracershopSMTP.SendResetPasswordEmail(UserInQuestion, PWrequest)




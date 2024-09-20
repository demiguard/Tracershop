# Python standard Library
from logging import getLogger
from typing import Optional

# Third party Packages
from django.views.generic import View
from django.http import HttpResponse
from django.core.handlers.wsgi import WSGIRequest
from django.contrib.auth import authenticate

# Tracershop Production packages
from constants import DEBUG_LOGGER
from database.models import User, UserGroups, SuccessfulLogin

from tracerauth.backend import TracershopAuthenticationBackend

logger = getLogger(DEBUG_LOGGER)


class ExternalLoginView(View):
  name = "external"
  path = "external"
  def get(self, request: WSGIRequest):
    if 'username' not in request.GET or 'password' not in request.GET:
      logger.info("Authentication failed incorrectly formatted message")
      return HttpResponse(status=403)

    user: Optional[User] = authenticate(username=request.GET['username'], # type: ignore
                                        password=request.GET['password'])

    if user is None:
      logger.info("Authentication failed with incorrect password")
      return HttpResponse(status=403)
    if user.user_group != UserGroups.ShopExternal:
      logger.info("Authentication failed with requested user having incorrect user group")
      return HttpResponse(status=403)
    #login(request, user, TracershopAuthenticationBackend)
    status_login = SuccessfulLogin(user=user)
    status_login.save()

    return HttpResponse(status=200)

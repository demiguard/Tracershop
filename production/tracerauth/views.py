# Python standard Library
from typing import Optional

# Third party Packages
from django.views.generic import View
from django.http import HttpResponse
from django.core.handlers.wsgi import WSGIRequest
from django.contrib.auth import authenticate, get_backends

# Tracershop Production packages
from database.models import User, UserGroups


class ExternalLoginView(View):
  name = "external"
  path = "external"
  def get(self, request: WSGIRequest):
    if 'username' not in request.GET or 'password' not in request.GET:
      return HttpResponse(status=403)

    user: Optional[User] = authenticate(username=request.GET['username'], # type: ignore
                                        password=request.GET['password'])
    if user is None:
      return HttpResponse(status=403)
    if user.UserGroup != UserGroups.ShopExternal:
      return HttpResponse(status=403)

    return HttpResponse(status=200)
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View


from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest

from constants import AUTH_USERNAME, AUTH_PASSWORD, AUTH_DETAIL

class AuthAuthenticate(View):
  name = "authenticate"
  path = "authenticate"


  def post(self, request):
    form = ParseJSONRequest(request)

    username = form.get(AUTH_USERNAME)
    password = form.get(AUTH_PASSWORD)

    # This code block prevent authentication while logged in as another user
    # This is mainly to clearify who is responsible for freeing Orders
    if request.user:
      if request.user.username != username:
        return ProductionJSONResponse({
          AUTH_DETAIL : False
        })

    user = authenticate(request, username=username, password=password)

    if user is None:
      return ProductionJSONResponse({
        AUTH_DETAIL : False
      })
    else:
      return ProductionJSONResponse({
        AUTH_DETAIL : True
      })
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View


from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest

from constants import AUTH_USERNAME, AUTH_PASSWORD, AUTH_DETAIL

class AuthLogin(View):
  path = "login"
  name = "login"

  INVALID_CRED_MESSAGE  = "Forkert password"
  SUCCESS_LOGIN_MESSAGE = "Login Successful"

  def post(self, request):
    form = ParseJSONRequest(request)

    username = form.get(AUTH_USERNAME)
    password = form.get(AUTH_PASSWORD)

    user = authenticate(request, username=username, password=password)


    if not(user):
      
      return ProductionJSONResponse({
        AUTH_DETAIL : self.INVALID_CRED_MESSAGE
      }, status=400)

    login(request, user)

    return ProductionJSONResponse({
      AUTH_DETAIL : self.SUCCESS_LOGIN_MESSAGE
    })

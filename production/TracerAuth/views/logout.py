from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View


from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest

from constants import AUTH_DETAIL

class AuthLogout(View):

  path = "logout"
  name = "logout"


  LOGOUT_MESSAGE = "Forkert password"
  NOT_LOGGED_IN_MESSAGE = "Du er ikke logged in"

  def get(self, request):
    if not request.user.is_authenticated:
      return ProductionJSONResponse({
        AUTH_DETAIL : self.NOT_LOGGED_IN_MESSAGE
      })
     
    logout(request)

    return ProductionJSONResponse({
      AUTH_DETAIL : self.LOGOUT_MESSAGE
    })
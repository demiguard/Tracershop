from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View


from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest

from constants import AUTH_USERNAME, AUTH_IS_AUTHENTICATED

class AuthWhoAmI(View):
  path = "whoami"
  name = "WhoAmI"


  @ensure_csrf_cookie
  def get(self, request):
    if not request.user.is_authenticated:
      return ProductionJSONResponse({AUTH_IS_AUTHENTICATED : False})

    return ProductionJSONResponse({AUTH_USERNAME : request.user.username})
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View


from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest

from constants import AUTH_IS_AUTHENTICATED

class AuthSession(View):
  path="session"
  name="session"

  @ensure_csrf_cookie
  def get(self, request):
    return ProductionJSONResponse({AUTH_IS_AUTHENTICATED : request.user.is_authenticated})
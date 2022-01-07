from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View
from django.utils.decorators import method_decorator

from lib.ProductionJSON import ProductionJSONResponse
from lib.Formatting import ParseJSONRequest
from TracerAuth.models import User
from constants import AUTH_IS_AUTHENTICATED

class AuthSession(View):
  path="session"
  name="session"

  @method_decorator(ensure_csrf_cookie)
  def get(self, request):
    return ProductionJSONResponse({AUTH_IS_AUTHENTICATED : request.user.is_authenticated})
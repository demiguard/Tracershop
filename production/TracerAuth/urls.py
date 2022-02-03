from django.urls import path

from lib.utils import LMAP


from TracerAuth.views.authenticate import AuthAuthenticate
from TracerAuth.views.login import   AuthLogin
from TracerAuth.views.logout import  AuthLogout
from TracerAuth.views.session import AuthSession
from TracerAuth.views.whoami import  AuthWhoAmI

Views = [
  AuthLogin,
  AuthLogout,
  AuthSession,
  AuthWhoAmI,
  AuthAuthenticate
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)
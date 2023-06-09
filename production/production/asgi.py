"""
ASGI config for production project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack, SessionMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.sessions import SessionMiddlewareStack

from django.core.asgi import get_asgi_application
from django.apps import apps

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django_asgi_app = get_asgi_application()

# Import that this line is here, otherwise load order is fucked up
from websocket import routing

application = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : AllowedHostsOriginValidator(
    SessionMiddlewareStack(
    AuthMiddlewareStack(
    URLRouter(routing.websocket_urlpatterns))
  ))
})

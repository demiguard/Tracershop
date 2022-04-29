from django.urls import re_path

from websocket.consumers.Consumer import Consumer
from websocket.consumers.TOrdersWebsocket import TOrderConsumer

websocket_urlpatterns = [
    re_path(r'ws/$', Consumer.as_asgi()),
    re_path(r'ws/TOrder/$', TOrderConsumer.as_asgi())
]

from django.urls import re_path

from websocket.consumers.FDGWebsocket import FDGConsumer
from websocket.consumers.TOrdersWebsocket import TOrderConsumer

websocket_urlpatterns = [
    re_path(r'ws/FDG/$', FDGConsumer.as_asgi()),
    re_path(r'ws/TOrder/$', TOrderConsumer.as_asgi())
]

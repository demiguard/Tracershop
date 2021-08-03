from django.urls import re_path

from websocket.consumers.FDGWebsocket import FDGConsumer

websocket_urlpatterns = [
    re_path(r'ws/FDG/$', FDGConsumer.as_asgi()),
]

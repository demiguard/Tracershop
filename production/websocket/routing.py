from django.urls import re_path

from websocket.consumers.ActivityOrderConsumer import ActivityOrderConsumer
from websocket.consumers.TOrdersWebsocket import TOrderConsumer

websocket_urlpatterns = [
    re_path(r'ws/activity/(?P<tracer_id>\w+)/$', ActivityOrderConsumer.as_asgi()),
    re_path(r'ws/TOrder/$', TOrderConsumer.as_asgi())
]

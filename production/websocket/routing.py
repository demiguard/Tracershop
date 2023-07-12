from django.urls import re_path

from websocket.consumer import Consumer

websocket_urlpatterns = [
    re_path(r'ws/$', Consumer.as_asgi(), name="consumer")
]

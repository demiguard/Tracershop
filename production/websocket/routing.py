from django.urls import re_path

from websocket.consumer import Consumer

websocket_urlpatterns = [
    re_path(r'ws\/(?P<connection_id>[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})$', Consumer.as_asgi(), name="consumer")
]

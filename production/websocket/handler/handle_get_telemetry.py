# Python standard library

# Third party modules
from channels.auth import get_user

# Tracershop modules
from core.exceptions import IllegalActionAttempted

from database.models import User

from shared_constants import WEBSOCKET_MESSAGE_GET_TELEMETRY, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE


from websocket.handler_base import HandlerBase

class HandleGetTelemetry(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_GET_TELEMETRY

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)

    if not user.is_server_admin:
      raise IllegalActionAttempted()

    serialized_data = await consumer.db.get_telemetry_data()

    await consumer.send_json({
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : serialized_data,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_TELEMETRY
    })
# Python standard library

# Third party modules
from channels.auth import get_user

# Tracershop modules
from core.exceptions import IllegalActionAttempted
from lib.utils import classproperty
from database.models import User

from shared_constants import WEBSOCKET_MESSAGE_GET_TELEMETRY, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_TYPES


from websocket.handler_base import HandlerBase

class HandleGetTelemetry(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_GET_TELEMETRY

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)

    if not user.is_server_admin:
      raise IllegalActionAttempted()

    telemetry_data = await consumer.db.get_telemetry_data()

    await consumer.send_json({
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : telemetry_data,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_TELEMETRY
    })
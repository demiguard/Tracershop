# Python standard library

# Third party modules
from channels.auth import get_user

# Tracershop modules
from core.exceptions import IllegalActionAttempted
from lib.utils import classproperty
from database.models import User

from shared_constants import WEBSOCKET_MESSAGE_READ_TELEMETRY, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES


from websocket.handler_base import HandlerBase

class HandleReadTelemetry(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_GET_TELEMETRY

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)

    if not user.is_server_admin:
      raise IllegalActionAttempted()

    telemetry_data = await consumer.db.get_telemetry_data()

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY, {
      "consumer" : consumer,
      "message_id" : message[WEBSOCKET_MESSAGE_ID],
      "telemetry_data" : telemetry_data,
    })

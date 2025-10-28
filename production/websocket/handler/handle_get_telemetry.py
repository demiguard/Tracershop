# Python standard library

# Third party modules

# Tracershop modules
from core.exceptions import IllegalActionAttempted
from lib.utils import classproperty
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES
from websocket.handler_base import HandlerBase

class HandleReadTelemetry(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({})

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_READ_TELEMETRY

  async def __call__(self, consumer, message):
    user = await get_logged_in_user(consumer.scope)

    if not user.is_server_admin:
      raise IllegalActionAttempted()

    telemetry_data = await consumer.db.a_get_telemetry_data()

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY, {
      "consumer" : consumer,
      "message_id" : message[WEBSOCKET_MESSAGE_ID],
      "telemetry_data" : telemetry_data,
    })

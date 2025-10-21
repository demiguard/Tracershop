# Python standard library
from logging import getLogger

# Third party modules

# Tracershop modules
from core.exceptions import IllegalActionAttempted
from lib.utils import classproperty
from constants import MESSENGER_CONSUMER
from shared_constants import DATA_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase

class HandleRestoreOrders(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({

    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_RESTORE_ORDERS

  async def __call__(self, consumer, message):
    user = await get_logged_in_user(consumer.scope)

    if not user.is_production_member:
      raise IllegalActionAttempted

    orders = await consumer.db.restoreDestinations(message[DATA_ACTIVITY_ORDER])

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_DATA : { DATA_ACTIVITY_ORDER : orders }
    })

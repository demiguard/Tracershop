# Python standard library

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from lib.utils import classproperty

from constants import MESSENGER_CONSUMER

from shared_constants import WEBSOCKET_MESSAGE_MOVE_ORDERS,\
  DATA_ACTIVITY_ORDER, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES

from websocket.handler_base import HandlerBase

class HandleMoveOrders(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MOVE_ORDERS

  async def __call__(self, consumer, message):
    orders = await consumer.db.moveOrders(message[DATA_ACTIVITY_ORDER], message[DATA_DELIVER_TIME])

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE,{
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : { DATA_ACTIVITY_ORDER : orders },
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_REFRESH : False,
    })
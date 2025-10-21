# Python standard library

# Third party modules

# Tracershop modules
from core.exceptions import IllegalActionAttempted
from lib.utils import classproperty
from constants import MESSENGER_CONSUMER
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message, Array
from shared_constants import WEBSOCKET_MESSAGE_MOVE_ORDERS,\
  DATA_ACTIVITY_ORDER, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES

from websocket.handler_base import HandlerBase

class HandleMoveOrders(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      DATA_ACTIVITY_ORDER : Array(int),
      DATA_DELIVER_TIME : int
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MOVE_ORDERS

  async def __call__(self, consumer, message):
    user = await get_logged_in_user(consumer.scope)

    if not user.is_production_member:
      raise IllegalActionAttempted(f"{user.username} attempted to move orders")

    orders = await consumer.db.moveOrders(message[DATA_ACTIVITY_ORDER], message[DATA_DELIVER_TIME])

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE,{
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : { DATA_ACTIVITY_ORDER : orders },
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_REFRESH : False,
    })
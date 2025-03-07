# Python standard library

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from lib.utils import classproperty
from shared_constants import WEBSOCKET_MESSAGE_MOVE_ORDERS,\
  DATA_ACTIVITY_ORDER, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES

from websocket.handler_base import HandlerBase

class HandleMoveOrders(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MOVE_ORDERS

  async def __call__(self, consumer, message):
    orders = await consumer.db.moveOrders(message[DATA_ACTIVITY_ORDER], message[DATA_DELIVER_TIME])
    customerIDs = await consumer.db.getCustomerIDs(orders)

    await consumer.broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : {DATA_ACTIVITY_ORDER : orders,},
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)
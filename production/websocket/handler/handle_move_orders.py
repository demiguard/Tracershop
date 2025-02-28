# Python standard library

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from shared_constants import WEBSOCKET_MESSAGE_MOVE_ORDERS,\
  DATA_ACTIVITY_ORDER, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH

from websocket.handler_base import HandlerBase

class HandleMoveOrders(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_MOVE_ORDERS

  async def __call__(self, consumer, message):
    orders = await consumer.db.moveOrders(message[DATA_ACTIVITY_ORDER], message[DATA_DELIVER_TIME])
    customerIDs = await consumer.db.getCustomerIDs(orders)

    await consumer._broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : {DATA_ACTIVITY_ORDER : orders,},
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)
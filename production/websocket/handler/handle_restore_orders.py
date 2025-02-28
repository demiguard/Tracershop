# Python standard library
from logging import getLogger
import subprocess

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import AUDIT_LOGGER, ERROR_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_RESTORE_ORDERS,\
  DATA_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD


from websocket.handler_base import HandlerBase

class HandleRestoreOrders(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_RESTORE_ORDERS

  async def __call__(self, consumer, message):
    orders = await consumer.db.restoreDestinations(message[DATA_ACTIVITY_ORDER])
    customerIDs = await consumer.db.getCustomerIDs(orders)

    await consumer._broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : {
        DATA_ACTIVITY_ORDER : orders,
      },
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)

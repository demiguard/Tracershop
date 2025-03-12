# Python standard library
from logging import getLogger

# Third party modules

# Tracershop modules
from lib.utils import classproperty
from shared_constants import DATA_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_TYPES

from websocket.handler_base import HandlerBase

class HandleRestoreOrders(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_RESTORE_ORDERS

  async def __call__(self, consumer, message):
    orders = await consumer.db.restoreDestinations(message[DATA_ACTIVITY_ORDER])
    customerIDs = await consumer.db.getCustomerIDs(orders)



    await consumer.broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : {
        DATA_ACTIVITY_ORDER : orders,
      },
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)

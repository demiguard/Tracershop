# Python standard library
from logging import getLogger

# Third party modules
from channels.auth import get_user

# Tracershop modules
from core.exceptions import RequestingNonExistingEndpoint
from constants import ERROR_LOGGER, MESSENGER_CONSUMER
from lib.formatting import timeConverter
from lib.utils import classproperty
from shared_constants import WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_ERROR,\
  ERROR_TYPE, ERROR_NO_VALID_TIME_SLOTS, ERROR_EARLY_BOOKING_TIME,\
  ERROR_EARLY_TIME_SLOT, DATA_INJECTION_ORDER, DATA_ACTIVITY_ORDER,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_TYPES

from websocket.handler_base import HandlerBase

class HandleMassOrders(HandlerBase):

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MASS_ORDER

  async def __call__(self, consumer, message):
    """Handler function for the WEBSOCKET_MESSAGE_MASS_ORDER messages.
    The message types indicates a user wishes to place a number of orders
    such that some bookings will have sufficient tracer.

    Bookings have related procedures which knows what tracer and amount is
    needed.

    Args:
        message (Dict[str, Any]): message send by the user. Has the
                                  WEBSOCKET_DATA with a dict value on the format
                                  { $AccessionNumber : Boolean }
                                  Each $AccessionNumber may be related to a
                                  booking object, if not it's ignored.
                                  The Boolean describes if the over is accepted
                                  or rejected.
    """
    user = await get_user(consumer.scope)

    try:
      orders = await consumer.db.massOrder(message[WEBSOCKET_DATA], user)
    except RequestingNonExistingEndpoint as exception: # pragma: no cover
      if exception.earliest_available_order_time is not None:
        early_booking_time = timeConverter(exception.earliest_available_order_time)
      else:
        early_booking_time = ""

      return await consumer.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ERROR,
        WEBSOCKET_ERROR : {
          ERROR_TYPE : ERROR_NO_VALID_TIME_SLOTS,
          ERROR_EARLY_BOOKING_TIME : timeConverter(exception.booking_start_time),
          ERROR_EARLY_TIME_SLOT : early_booking_time,
        }
      })

    ActivityCustomerIDs = await consumer.db.getCustomerIDs(orders[DATA_ACTIVITY_ORDER])
    InjectionCustomerIDs = await consumer.db.getCustomerIDs(orders[DATA_INJECTION_ORDER])

    customerIDset = set(ActivityCustomerIDs+InjectionCustomerIDs)
    customerIDs = [customerID for customerID in customerIDset]

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : orders,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    })
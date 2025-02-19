# Python Standard Library

# Third party packages

# Tracershop modules
from lib.formatting import toDate

from shared_constants import WEBSOCKET_MESSAGE_GET_BOOKINGS, WEBSOCKET_DATE,\
  WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_DATA,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE


from websocket.handler_base import HandlerBase

class HandleGetBooking(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_GET_BOOKINGS

  async def __call__(self, consumer, message):
    """This is mostly here because Bookings ended up being 10 mb data, so
    there's a specific endpoint, there should also be a filter for

    Args:
        message (Dict[str, Any]): _description_
    """
    booking_date = toDate(message[WEBSOCKET_DATE][:10])
    bookings = await consumer.db.get_bookings(
      booking_date,
      message[WEBSOCKET_DATA_ID]
    )

    await consumer.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_DATA : bookings,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_BOOKINGS,
    })

# Python Standard Library
from typing import Dict, List

# Third party packages

# Tracershop modules
from constants import MESSENGER_CONSUMER
from database.models import Booking
from lib.formatting import toDate
from lib.utils import classproperty
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_DATE, WEBSOCKET_DATA_ID,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES
from websocket.handler_base import HandlerBase

class HandleReadBooking(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      WEBSOCKET_DATE : str,
      WEBSOCKET_DATA_ID : int
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_READ_BOOKINGS

  async def __call__(self, consumer, message):
    """This is mostly here because Bookings ended up being 10 mb data, so
    there's a specific endpoint, there should also be a filter for

    Args:
        message (Dict[str, Any]): _description_
    """
    booking_date = toDate(message[WEBSOCKET_DATE][:10])
    bookings: Dict[str, List[Booking]] = await consumer.db.get_bookings(
      booking_date,
      message[WEBSOCKET_DATA_ID]
    )

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_BOOKINGS, {
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : bookings,
      MESSENGER_CONSUMER : consumer
    })
    return

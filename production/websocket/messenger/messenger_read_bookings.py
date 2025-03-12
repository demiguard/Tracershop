# Python Standard Library
from dataclasses import dataclass, field
from typing import List

# Third party packages

# Tracershop Packages
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE

from database.models import Booking
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerReadBooking(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_REFRESH : False,
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_BOOKINGS,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_BOOKINGS

  @dataclass
  class Args(MessengerBase.MessageArgs):
    consumer: consumer.Consumer
    message_id: int
    bookings: List[Booking] = field(default_factory=list)

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    await args.consumer.send_json(await cls.message_blueprint.serialize({
      WEBSOCKET_DATA : args.bookings,
      WEBSOCKET_MESSAGE_ID : args.message_id
    }))

# Python Standard Library
from dataclasses import dataclass, field, make_dataclass
from typing import Dict, List

# Third party packages

# Tracershop Packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE

from database.models import Booking
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint,\
  MessageDataField, TracershopState, MessageDataType
from websocket import consumer

class MessengerReadBooking(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_ID : MessageDataField(int),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
    WEBSOCKET_DATA : MessageDataField(MessageDataType.STATE),
    WEBSOCKET_REFRESH : False,
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_BOOKINGS,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_BOOKINGS

  Args = make_dataclass('Args', fields=[
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_DATA, MessageDataType.STATE)
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]

    await consumer_.send_json(await cls.message_blueprint.serialize(args))

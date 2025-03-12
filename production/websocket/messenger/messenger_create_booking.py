
# Python Standard Library
from dataclasses import field, make_dataclass
from typing import Dict

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop Packages
from database.models import Booking
from constants import CHANNEL_GROUP_GLOBAL, CHANNEL_TARGET_KEYWORD,\
  CHANNEL_TARGET_BROADCAST_FUNCTION
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA, DATA_BOOKING, WEBSOCKET_DATATYPE,\
  WEBSOCKET_MESSAGE_TYPE

from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, getNewMessageID,\
  MessageBlueprint, MessageField, MessageDataField


class MessengerCreateBooking(MessengerBase):
  message_blueprint = MessageBlueprint({
    CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
    WEBSOCKET_MESSAGE_ID : MessageField(getNewMessageID),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_CREATE_BOOKING,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_CREATE_BOOKING

  # This is just a fancy way of generating Classes, that ensures I can use
  # constants for creating the class
  Args = make_dataclass("Args", [
    (DATA_BOOKING, Dict[str, Booking])
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    channel_layer: RedisChannelLayer = get_channel_layer() # type: ignore

    await channel_layer.group_send(
      CHANNEL_GROUP_GLOBAL, await cls.message_blueprint.serialize(args)
    )
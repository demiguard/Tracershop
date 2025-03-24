# Python standard library
from dataclasses import make_dataclass, field
from typing import List

# Third party model
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop modules
from constants import CHANNEL_GROUP_GLOBAL, CHANNEL_TARGET_KEYWORD,\
  CHANNEL_TARGET_BROADCAST_FUNCTION
from lib.utils import classproperty
from websocket.messenger_base import getNewMessageID
from shared_constants import WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, DATA_BOOKING, WEBSOCKET_MESSAGE_TYPE
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageField, MessageDataField

class MessengerDeleteBooking(MessengerBase):
  message_blueprint = MessageBlueprint({
        CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
        WEBSOCKET_MESSAGE_ID : MessageField(getNewMessageID),
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_DATA_ID : MessageDataField(),
        WEBSOCKET_DATATYPE : DATA_BOOKING,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING,
      })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING

  Args = make_dataclass('Args', fields=[
    (WEBSOCKET_DATA_ID, List[int])
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("You passed another Messenger's arguments to this class, and now you get a bonehead exception!")

    channel_layer: RedisChannelLayer = get_channel_layer() # type: ignore
    await channel_layer.group_send(CHANNEL_GROUP_GLOBAL,
                                   await cls.message_blueprint.serialize(args))

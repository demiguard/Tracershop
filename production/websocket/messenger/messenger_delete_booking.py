# Python standard library
from dataclasses import dataclass

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
        WEBSOCKET_DATA : True,
        WEBSOCKET_DATATYPE : DATA_BOOKING,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING,
      })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING

  @dataclass
  class Args(MessengerBase.MessageArgs):
    booking_id: int

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args: 'MessengerDeleteBooking.Args'):
    channel_layer: RedisChannelLayer = get_channel_layer()
    await channel_layer.group_send(CHANNEL_GROUP_GLOBAL,
                                   await cls.message_blueprint.serialize({
                                     WEBSOCKET_DATA_ID : [args.booking_id]
                                   }))

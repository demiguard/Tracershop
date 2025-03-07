# Python Standard Library
from dataclasses import dataclass

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop Packages
from shared_constants import WEBSOCKET_SERVER_MESSAGES
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase
from websocket import consumer

class MessengerCreateBooking(MessengerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE

  @dataclass
  class Args(MessengerBase.MessageArgs):
    pass

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, consumer: 'consumer.Consumer', args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    await consumer.broadcastGlobal({

    })

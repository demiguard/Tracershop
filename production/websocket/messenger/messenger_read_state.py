# Python Standard Library
from dataclasses import dataclass, field
from typing import Any, Dict

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop Packages
from constants import CHANNEL_TARGET_KEYWORD, CHANNEL_TARGET_BROADCAST_FUNCTION,\
  CHANNEL_GROUP_GLOBAL

from shared_constants import WEBSOCKET_SERVER_MESSAGES, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_SUCCESS
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerReadState(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_REFRESH : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_STATE,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_STATE

  @dataclass
  class Args(MessengerBase.MessageArgs):
    consumer: consumer.Consumer
    message_id: int
    status: SUCCESS_STATUS_CRUD
    data: Dict[str, Any] = field(default_factory=dict)
    refresh: bool = False

    def get_group():
      return CHANNEL_GROUP_GLOBAL

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args): # pragma: no cover
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    await args.consumer.send_json(
      await cls.message_blueprint.serialize({
        WEBSOCKET_MESSAGE_ID : args.message_id,
        WEBSOCKET_DATA : args.data,
        WEBSOCKET_REFRESH : args.refresh,
      })
    )
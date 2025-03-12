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
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_SUCCESS,\
  AUTH_IS_AUTHENTICATED

from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerCreateBooking(MessengerBase):
  message_blueprint = MessageBlueprint({
    CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
    AUTH_IS_AUTHENTICATED : MessageDataField(),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
    WEBSOCKET_REFRESH : MessageDataField(),
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE

  @dataclass
  class Args(MessengerBase.MessageArgs):
    consumer: consumer.Consumer
    message_id: int
    is_auth : bool
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
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    RESPONSE = await cls.message_blueprint.serialize({
      AUTH_IS_AUTHENTICATED : args.is_auth,
      WEBSOCKET_MESSAGE_ID : args.message_id,
      WEBSOCKET_DATA : args.data,
      WEBSOCKET_REFRESH : args.refresh,
    })

    if args.is_auth:
      # There's a whole great issue figuring out where to send what.
      LAYER: RedisChannelLayer = get_channel_layer()

      await LAYER.group_send(
        args.get_group(),
        RESPONSE
      )
    else:
      await args.consumer.send_json(
        RESPONSE
      )

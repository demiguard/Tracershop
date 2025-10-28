# Python Standard Library
from dataclasses import dataclass, field, make_dataclass
from typing import Any, Dict, List

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop Packages
from constants import CHANNEL_TARGET_KEYWORD, CHANNEL_TARGET_BROADCAST_FUNCTION,\
  CHANNEL_GROUP_GLOBAL, MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_SUCCESS,\
  AUTH_IS_AUTHENTICATED
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint,\
  MessageDataField, MessageDataType
from websocket import consumer

class MessengerUpdatePrivilegeState(MessengerBase):
  message_blueprint = MessageBlueprint({
    CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
    AUTH_IS_AUTHENTICATED : MessageDataField(),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_DATA : MessageDataField(MessageDataType.STATE),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
    WEBSOCKET_REFRESH : MessageDataField(),
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE

  Args = make_dataclass('Args', fields=[
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (AUTH_IS_AUTHENTICATED, bool),
    (WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD),
    (WEBSOCKET_DATA, MessageDataType.STATE, field(default_factory=dict)),
    (WEBSOCKET_REFRESH, bool, field(default=False))
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def get_group(cls):
    return CHANNEL_GROUP_GLOBAL

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args): # pragma: no cover
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]

    RESPONSE = await cls.message_blueprint.serialize(args)

    if args[AUTH_IS_AUTHENTICATED]:
      # There's a whole great issue figuring out where to send what.
      LAYER: RedisChannelLayer = get_channel_layer() # type: ignore

      await LAYER.group_send(
        cls.get_group(),
        RESPONSE
      )
    else:
      await consumer_.send_json(
        RESPONSE
      )

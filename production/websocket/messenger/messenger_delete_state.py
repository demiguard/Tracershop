# Python standard library
from dataclasses import dataclass, field, make_dataclass
from typing import List

# Third party model
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop modules
from constants import CHANNEL_GROUP_GLOBAL, CHANNEL_TARGET_KEYWORD,\
  CHANNEL_TARGET_BROADCAST_FUNCTION, MESSENGER_CONSUMER
from lib.utils import classproperty
from websocket import consumer
from shared_constants import WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_TYPE,\
  SUCCESS_STATUS_CRUD
from websocket.messenger_base import MessengerBase, MessageBlueprint,\
  MessageDataField

class MessengerDeleteState(MessengerBase):
  message_blueprint = MessageBlueprint({
    CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
    WEBSOCKET_MESSAGE_STATUS : MessageDataField(),
    WEBSOCKET_DATA_ID : MessageDataField(),
    WEBSOCKET_DATATYPE : MessageDataField(),
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_STATE,
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS
  })


  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_STATE

  Args = make_dataclass('Args', fields=[
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD),
    (WEBSOCKET_DATATYPE, str),
    (WEBSOCKET_DATA_ID, List[int], field(default_factory=list))
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args): # pragma: no cover
      raise TypeError("You passed an MessageArgs from another class and got this bonehead exception!")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]
    response = await cls.message_blueprint.serialize(args)

    if args[WEBSOCKET_MESSAGE_STATUS] == SUCCESS_STATUS_CRUD.SUCCESS:
      channel_layer: RedisChannelLayer = get_channel_layer() # type: ignore
      await channel_layer.group_send(CHANNEL_GROUP_GLOBAL, response)
    else:
      await consumer_.send_json(response)

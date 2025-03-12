# Python standard library
from dataclasses import dataclass, field
from typing import List

# Third party model
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop modules
from constants import CHANNEL_GROUP_GLOBAL, CHANNEL_TARGET_KEYWORD,\
  CHANNEL_TARGET_BROADCAST_FUNCTION
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

  @dataclass(slots=True)
  class Args(MessengerBase.MessageArgs):
    consumer: consumer.Consumer
    message_id : int
    status: SUCCESS_STATUS_CRUD
    datatype : str
    data_ids: List[int] = field(default_factory=list)

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args: 'MessengerDeleteState.Args'):
    if args.status == SUCCESS_STATUS_CRUD.SUCCESS:
      response = await cls.message_blueprint.serialize({
        WEBSOCKET_MESSAGE_STATUS : args.status,
        WEBSOCKET_DATA_ID : args.data_ids,
        WEBSOCKET_DATATYPE : args.datatype,
        WEBSOCKET_MESSAGE_ID : args.message_id,
      })
      channel_layer: RedisChannelLayer = get_channel_layer()
      await channel_layer.group_send(CHANNEL_GROUP_GLOBAL, response)
    else:
      response = await cls.message_blueprint.serialize({
        WEBSOCKET_MESSAGE_STATUS : args.status,
        WEBSOCKET_DATA_ID : [],
        WEBSOCKET_DATATYPE : "",
        WEBSOCKET_MESSAGE_ID : args.message_id,
      })

      await args.consumer.send_json(response)

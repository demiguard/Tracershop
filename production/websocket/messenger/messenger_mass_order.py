# Python Standard Library
from dataclasses import field, make_dataclass
from typing import Optional

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer


# Tracershop modules
from constants import CHANNEL_TARGET_KEYWORD, CHANNEL_TARGET_BROADCAST_FUNCTION,\
  CHANNEL_GROUP_GLOBAL, MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_SUCCESS,\
  DATA_BOOKING
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint,\
  MessageDataField, MessageDataType
from websocket import consumer

class MessengerMassOrder(MessengerBase):
  message_blueprint = MessageBlueprint({
    CHANNEL_TARGET_KEYWORD : CHANNEL_TARGET_BROADCAST_FUNCTION,
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : MessageDataField(SUCCESS_STATUS_CRUD),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_MASS_ORDER,
    WEBSOCKET_MESSAGE_ID : MessageDataField(int),
    WEBSOCKET_DATA : MessageDataField(MessageDataType.STATE),
    DATA_BOOKING : MessageDataField(MessageDataType.STATE),
  })

  Args = make_dataclass("Args", [
    (MESSENGER_CONSUMER, Optional[consumer.Consumer]),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD),
    (DATA_BOOKING, MessageDataType.STATE, field(default_factory=dict)),
    (WEBSOCKET_DATA, MessageDataType.STATE, field(default_factory=dict)),
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def get_group(cls):
    return CHANNEL_GROUP_GLOBAL

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_MASS_ORDER


  @classmethod
  async def __call__(cls, args: MessengerBase.MessageArgs) -> None:
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerMassOrder call must be of type MessengerMassOrder.Args")

    LAYER: RedisChannelLayer = get_channel_layer() # type: ignore
    if args[WEBSOCKET_MESSAGE_STATUS] == SUCCESS_STATUS_CRUD.SUCCESS:
      await LAYER.group_send(
        cls.get_group(),
        await cls.message_blueprint.serialize(args)
      )
    else:
      if args[MESSENGER_CONSUMER] is not None:
        consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]
        await consumer_.send_json(await cls.message_blueprint.serialize(args))

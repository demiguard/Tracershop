# Python Standard Library
from dataclasses import make_dataclass

# Third party packages
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer

# Tracershop Packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_ERROR, WEBSOCKET_MESSAGE_STATUS,\
  SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_TYPE
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerError(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_ID : MessageDataField(int),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_ERROR : MessageDataField(str), # This is the error message, !!!displayable!!!
    WEBSOCKET_MESSAGE_STATUS :  MessageDataField(SUCCESS_STATUS_CRUD),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_ERROR
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_ERROR

  Args = make_dataclass('Args', [
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_ERROR, str),
    (WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD),
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args): # pragma no cover
      raise TypeError("MessengerError call must be of type MessengerError.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]

    await consumer_.send_json(await cls.message_blueprint.serialize(args))

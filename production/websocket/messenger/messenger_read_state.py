# Python Standard Library
from dataclasses import field, make_dataclass

# Third party packages

# Tracershop Packages
from constants import MESSENGER_CONSUMER

from shared_constants import WEBSOCKET_SERVER_MESSAGES, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_SUCCESS
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint,\
  MessageDataField, TracershopState, MessageDataType
from websocket import consumer

class MessengerReadState(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(int),
    WEBSOCKET_DATA : MessageDataField(MessageDataType.STATE),
    WEBSOCKET_REFRESH : MessageDataField(bool),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_STATE,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_STATE

  Args = make_dataclass('Args', fields=[
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD),
    (WEBSOCKET_DATA, TracershopState, field(default_factory=dict)),
    (WEBSOCKET_REFRESH, bool, field(default=False))
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args): # pragma: no cover
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]

    await consumer_.send_json(
      await cls.message_blueprint.serialize(args)
    )
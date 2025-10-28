# Python Standard Library
from dataclasses import dataclass, field, make_dataclass
from typing import Optional
# Third party packages

# Tracershop Packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, AUTH_IS_AUTHENTICATED,\
  DATA_USER, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, DATA_USER
from lib.utils import classproperty
from database.models import User
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerAuthResponse(MessengerBase):
  message_blueprint = MessageBlueprint({
    AUTH_IS_AUTHENTICATED : MessageDataField(bool),
    DATA_USER : MessageDataField(Optional[User]),
    WEBSOCKET_SESSION_ID : MessageDataField(str),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE,
    WEBSOCKET_MESSAGE_ID : MessageDataField(int),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE

  Args = make_dataclass('Args', [
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_SESSION_ID, str),
    (AUTH_IS_AUTHENTICATED, bool),
    (DATA_USER, Optional[User])
  ], slots=True, bases=(MessengerBase.MessageArgs,))

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    # Just a bonehead exception
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerAuthResponse call must be of type MessengerAuthResponse.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]

    await consumer_.send_json(
      await cls.message_blueprint.serialize(args)
    )

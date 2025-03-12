# Python Standard Library
from dataclasses import dataclass, field
from typing import Optional
# Third party packages

# Tracershop Packages
from database.models import User
from shared_constants import WEBSOCKET_SERVER_MESSAGES, AUTH_IS_AUTHENTICATED,\
  AUTH_USER, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerAuthResponse(MessengerBase):
  message_blueprint = MessageBlueprint({
    AUTH_IS_AUTHENTICATED : MessageDataField(),
    AUTH_USER : MessageDataField(),
    WEBSOCKET_SESSION_ID : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE

  @dataclass(slots=True)
  class Args(MessengerBase.MessageArgs):
    consumer : consumer.Consumer
    message_id : int
    session_id : str
    is_auth : bool
    user: Optional[User]

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    # Just a bonehead exception
    if not isinstance(args, cls.Args): # pragma: no cover
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    await args.consumer.send_json(
      await cls.message_blueprint.serialize({
        WEBSOCKET_MESSAGE_ID : args.message_id,
        AUTH_IS_AUTHENTICATED : args.is_auth,
        AUTH_USER : args.user,
        WEBSOCKET_SESSION_ID : args.session_id
      })
    )

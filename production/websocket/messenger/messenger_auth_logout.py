# Python Standard Library
from dataclasses import dataclass, make_dataclass

# Third party packages

# Tracershop Packages
#from constants import *
from shared_constants import WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPE

from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageDataField,\
  MessageBlueprint
from websocket import consumer

class MessengerAuthLogout(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_LOGOUT,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_LOGOUT

  Args = make_dataclass("Args", fields=[
    ('consumer', consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
  ], slots=True, bases=[MessengerBase.MessageArgs])

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    await args.consumer.send_json(
      await cls.message_blueprint.serialize({
        WEBSOCKET_MESSAGE_ID : getattr(args, WEBSOCKET_MESSAGE_ID)
      })
    )

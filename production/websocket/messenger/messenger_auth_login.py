# Python Standard Library
from dataclasses import dataclass, field
from typing import Optional
# Third party packages

# Tracershop Packages
from database.models import User
from shared_constants import WEBSOCKET_SERVER_MESSAGES
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase
from websocket import consumer

class MessengerCreateBooking(MessengerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_CREATE_BOOKING

  @dataclass(slots=True)
  class Args(MessengerBase.MessageArgs):
    is_auth : bool
    user : Optional[User]

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, consumer: 'consumer.Consumer', args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

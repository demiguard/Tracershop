# Python standard library
from dataclasses import dataclass

# Third party model

# Tracershop modules
from lib.utils import classproperty
from shared_constants import WEBSOCKET_SERVER_MESSAGES
from websocket import consumer
from websocket.messenger_base import MessengerBase

class MessengerDeleteBooking(MessengerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING

  @dataclass
  class Args(MessengerBase.MessageArgs):
    pass

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  async def __call__(self, consumer: 'consumer.Consumer', args: MessengerBase.MessageArgs):
    pass

  #@classmethod
  #def generateExampleMessage(cls):
  #  return ""
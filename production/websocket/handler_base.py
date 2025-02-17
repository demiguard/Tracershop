"""Module for the Handler base class, which have its own file to prevent
circular imports

It really is just an interface for the handlers in websocket
"""

# Python standard library
from abc import ABC, abstractmethod

# Tracershop modules
from websocket import consumer

BASE_MESSAGE_TYPE = "ABSTRACT"

class HandlerBase(ABC):
  """Interface for websocket message handlers
  * message_type - class attribute for the handler indicating the message that
    is covered by this handler
  * __call__  method: the message handling function

  """
  message_type = BASE_MESSAGE_TYPE
  """The message that the handler handles, cannot be ABSTRACT"""

  @abstractmethod
  async def __call__(self, consumer: 'consumer.Consumer', message):
    return super().__call__(consumer, message)

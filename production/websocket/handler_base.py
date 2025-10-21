"""Module for the Handler base class, which have its own file to prevent
circular imports

It really is just an interface for the handlers in websocket
"""

# Python standard library
from abc import ABC, abstractmethod
from typing import Any

# Tracershop modules
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_MESSAGE_TYPES
from lib.utils import classproperty

from websocket import consumer

BASE_MESSAGE_TYPE = "ABSTRACT"

class HandlerBase(ABC):
  """Interface for websocket message handlers
  * message_type - class attribute for the handler indicating the message that
    is covered by this handler
  * __call__  method: the message handling function

  """
  @classproperty
  def blueprint(cls) -> Message:
    raise NotImplemented


  @classproperty
  def message_type(cls) -> WEBSOCKET_MESSAGE_TYPES: #pragma: no cover
    raise NotImplemented

  """The message that the handler handles, cannot be ABSTRACT"""

  @abstractmethod
  async def __call__(self, consumer: 'consumer.Consumer', message) -> Any:
    raise NotImplemented #pragma: no cover

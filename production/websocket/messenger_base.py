"""This module concerns itself with creating messages"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from abc import ABC, abstractmethod
from dataclasses import dataclass
from random import randint
from typing import Dict, Type, TypedDict, TypeVar


# Tracershop modules

from shared_constants import WEBSOCKET_SERVER_MESSAGES
from lib.utils import classproperty

from websocket import consumer

class Message(TypedDict, total=False):
  message_id : int
  message_type : str


def getNewMessageID() -> int:
  """Gets a random message ID

  Note that javascript only natively support 32 bit integers,
  and floating point arithmetic starts fucking up at 64 bit.
  So I just limited it to 32 bit.

  Returns:
      int : A random number from [0, 2147483648]
  """
  return randint(0, 1 << 32 - 1)


class MessengerBase(ABC):
  """Interface for a messenger is handling single type of message that is being
  send from the Server to client / clients

  Methods:
    message_type - class property which indicate which WEBSOCKET_SERVER_MESSAGES
                   the handler handles
    MessageArgs - dataclass, that are the args for the call operator
    getMessageArgs - Function that return the type of MessageArgs
    async __call__ - Call operator, which takes the websocket.consumer and an
                     instance of the MessageArgs, which must send the message
                     to the client




  """

  @classproperty
  def message_type(cls) -> str:
    raise NotImplemented

  @dataclass
  class MessageArgs:
    pass

  @classmethod
  @abstractmethod
  def getMessageArgs(cls) -> Type[MessageArgs]:
    raise NotImplemented

  @classmethod
  @abstractmethod
  async def __call__(cls, consumer: 'consumer.Consumer', args: MessageArgs):
    raise NotImplemented

  #@classmethod
  #@abstractmethod
  #def generateExampleMessage(cls) -> str:
  #  raise NotImplemented

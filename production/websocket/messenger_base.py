"""This module concerns itself with creating messages"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from abc import ABC, abstractmethod
from copy import deepcopy
from dataclasses import dataclass
from random import randint
from typing import Any,Callable, Dict, Type


# Tracershop modules
from shared_constants import WEBSOCKET_SERVER_MESSAGES
from lib.utils import classproperty
from lib.serialization import a_serialize_redis

def getNewMessageID() -> int:
  """Gets a random message ID

  Note that javascript only natively support 32 bit integers,
  and floating point arithmetic starts fucking up at 64 bit.
  So I just limited it to 32 bit.

  Returns:
      int : A random number from [0, 2147483648]
  """
  return randint(0, 1 << 32 - 1) # this would have been ub if it was C


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
  def message_type(cls) -> WEBSOCKET_SERVER_MESSAGES:
    raise NotImplementedError

  @dataclass
  class MessageArgs:
    def __getitem__(self, key: str):
      return getattr(self, key)

  @classmethod
  @abstractmethod
  def getMessageArgs(cls) -> Type[MessageArgs]:
    raise NotImplementedError

  @classmethod
  @abstractmethod
  async def __call__(cls, args: MessageArgs) -> None:
    raise NotImplementedError

  #@classmethod
  #@abstractmethod
  #def generateExampleMessage(cls) -> str:
  #  raise NotImplemented

class MessageField:
  def __init__(self, generator: Callable[[], Any]):
    self.generator=generator

class MessageDataField():
  def __init__(self):
    pass


class MessageBlueprint:
  """Class describing a message in or out of the system

  Note that something similar is found in tracerauth, but it should be moved
  to this module
  """

  def __init__(self, skeleton: Dict[str, Any]):
    self.skeleton = skeleton

  async def serialize(self, data: MessengerBase.MessageArgs) -> Dict[str, Any]:
    clone = deepcopy(self.skeleton)

    # Note that we iterate over the skeleton, and not the clone, to circumvent
    # indexing into an object that we are modifying
    for key, value in self.skeleton.items():
      if isinstance(value, MessageField):
        clone[key] = value.generator()
      if isinstance(value, MessageDataField):
        clone[key] = data[key]

    return await a_serialize_redis(clone)

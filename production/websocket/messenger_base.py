"""This module concerns itself with creating messages"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from abc import ABC, abstractmethod
from copy import deepcopy
from enum import Enum
from dataclasses import dataclass
from random import randint
from typing import Any, Callable, Dict, List, Type, TypeAlias


# Tracershop modules
from shared_constants import WEBSOCKET_SERVER_MESSAGES
from database.models import TracershopModel
from lib.formatting import format_message_name
from lib.utils import classproperty
from lib.serialization import a_serialize_redis

TracershopState: TypeAlias = Dict[str, List[TracershopModel]]

class MessageDataType(Enum):
  """This is to target specific type structures, because there needs to be a
  behavior which does something specific on the frontend

  """
  STATE = TracershopState

def getNewMessageID() -> int:
  """Gets a random message ID

  Note that javascript only natively support 32 bit integers,
  and floating point arithmetic starts fucking up at 64 bit.
  So I just limited it to 32 bit.

  Returns:
      int : A random number from [0, 2147483648]
  """
  return randint(0, 1 << 32 - 1) # pragma: no cover
  # this would have been ub if it was C and it was 32 bit int


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

  message_blueprint: 'MessageBlueprint'

  @classproperty
  def message_type(cls) -> WEBSOCKET_SERVER_MESSAGES:
    raise NotImplementedError # pragma: no cover

  @dataclass
  class MessageArgs:
    def __getitem__(self, key: str):
      return getattr(self, key)

  @classmethod
  @abstractmethod
  def getMessageArgs(cls) -> Type[MessageArgs]:
    raise NotImplementedError # pragma: no cover

  @classmethod
  @abstractmethod
  async def __call__(cls, args: MessageArgs) -> None:
    raise NotImplementedError # pragma: no cover

  #@classmethod
  #@abstractmethod
  #def generateExampleMessage(cls) -> str:
  #  raise NotImplemented

class MessageField:
  def __init__(self, generator: Callable[[], Any]):
    self.generator=generator

class MessageDataField():
  def __init__(self, key=None):
    self.key = key


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

  def to_javascript(self, message_type: WEBSOCKET_SERVER_MESSAGES) -> str: #pragma no cover
    """Function for building javascript that we need for this message

    Args:
      message_type (WEBSOCKET_SERVER_MESSAGES): The message type

    Returns:
        str: _description_
    """
    name = format_message_name(message_type.name)
    keys = [key for key in self.skeleton]

    javascript = f"export class {name} {{\n"\
                  "  constructor(message){\n"

    for key in keys:
      field = self.skeleton[key]
      if isinstance(field, MessageDataField) and field.key == MessageDataType.STATE:
        javascript += f"    this.{key} = deserialize(message[\"{key}\"])\n"
        continue


      javascript += f"    this.{key} = message[\"{key}\"]\n"

    javascript += "  }\n"

    javascript += f"}}\n"

    return javascript
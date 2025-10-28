"""Messenger is the component responsible for sending data back to the client.
It will dynamically load all python files in websocket/messenger and fail to
create if a message type is missing from
shared_constants.WEBSOCKET_SERVER_MESSAGES
It's only this class that is suppose to send data back the client, because
the "mapconstants" generates sample messages, which are tested against in the
frontend test suite
"""
# Python Standard Library
from importlib import import_module
from inspect import isclass, getmembers
from pathlib import Path
from typing import Dict, Type

# Third Party modules

# Tracershop Packages
from core.exceptions import ContractBroken
from shared_constants import WEBSOCKET_SERVER_MESSAGES

from websocket.messenger_base import MessengerBase

PYTHON_FILE_GLOB_PATTERN = "*.py"

class Messenger:
  def __init__(self):
    self.messengers: Dict[WEBSOCKET_SERVER_MESSAGES, MessengerBase] = {}

    messengerDir =  Path(__file__).parent

    for file_name in messengerDir.glob(PYTHON_FILE_GLOB_PATTERN):
      if file_name.name == '__init__.py':
        continue

      module = import_module(f"websocket.messenger.{file_name.name[:-3]}", "")

      for class_name, obj in getmembers(module, isclass):
        if obj is MessengerBase or not issubclass(obj, MessengerBase):
          continue

        try:
          instance = obj()
        except TypeError: #pragma: no cover
          raise ContractBroken(f"{class_name} has abstract method __call__ and can't be created!")

        if instance.message_type in self.messengers: # pragma: no cover
          raise ContractBroken(f"Duplicate messenger for {instance.message_type}!")

        self.messengers[instance.message_type] = instance

    missing_message_types = [
      mt for mt in WEBSOCKET_SERVER_MESSAGES if mt not in self.messengers
    ]

    if missing_message_types: # pragma: no cover
      raise ContractBroken(f"Messenger messenger missing for {missing_message_types}")

  def getMessageArgs(self, message_type: WEBSOCKET_SERVER_MESSAGES) -> Type[MessengerBase.MessageArgs]:
    return self.messengers[message_type].getMessageArgs()

  async def __call__ (self, message_type: WEBSOCKET_SERVER_MESSAGES, dict_args: Dict) -> None:
    Args = self.messengers[message_type].getMessageArgs()
    args = Args(**dict_args)

    await self.messengers[message_type](args)

"""Module for the message handler, which dynamically loads all handlers in the
folder

"""

# Python Standard Library
from logging import getLogger
from importlib import import_module
from inspect import getmembers, isclass
from pathlib import Path
from typing import Dict

# Tracershop Modules
from core.exceptions import ContractBroken
from constants import DEBUG_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_TYPES

from websocket import handler_base
from websocket import consumer

debug_logger = getLogger(DEBUG_LOGGER)


PYTHON_FILE_GLOB_PATTERN = "*.py"

class MessageHandler():
  """Container for handling of all the websocket messages

  Dynamically loads all handler in the websocket.handler directory
  """
  def __init__(self):
    self._handlers: Dict[WEBSOCKET_MESSAGE_TYPES, 'handler_base.HandlerBase'] = {}
    messageHandlerDir =  Path(__file__).parent


    for file_name in messageHandlerDir.glob(PYTHON_FILE_GLOB_PATTERN):
      if file_name.name == '__init__.py':
        continue

      module = import_module(f"websocket.handler.{file_name.name[:-3]}", "")

      for class_name, obj in getmembers(module, isclass):
        if obj is handler_base.HandlerBase:
          continue

        if issubclass(obj, handler_base.HandlerBase):
          try:
            instance = obj()
          except TypeError: #pragma: no cover
            raise ContractBroken(f"{class_name} has abstract method __call__ and can't be created!")

          if instance.message_type in self._handlers: # pragma: no cover
            raise ContractBroken(f"Duplicate handler for {instance.message_type}!")

          self._handlers[instance.message_type] = instance
    missing_message_types = [ mt for mt in WEBSOCKET_MESSAGE_TYPES if mt not in self._handlers]

    if missing_message_types: # pragma: no cover
      raise ValueError(f"Message Handler is missing {missing_message_types}")

  def __str__(self): #pragma: no cover
    return f"MessageHandler with keys {[k for k in self._handlers]} created"

  async def __call__(self, consumer: 'consumer.Consumer', message):
    message_type = WEBSOCKET_MESSAGE_TYPES(message[WEBSOCKET_MESSAGE_TYPE])
    if message_type not in self._handlers: # pragma: no cover
      raise ContractBroken()

    handler = self._handlers[message_type]

    await handler(consumer, message)

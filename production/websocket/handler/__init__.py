# Python Standard Librar
from logging import getLogger
from importlib import import_module
from inspect import getmembers, isclass
from pathlib import Path
from typing import Dict

# Tracershop Modules
from constants import DEBUG_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_TYPES

from websocket import consumer
from websocket.handler_base import HandlerBase, BASE_MESSAGE_TYPE

debug_logger = getLogger(DEBUG_LOGGER)


handler_file_glop_pattern = "*.py"

class MessageHandler():
  """Container for handling of all the websocket messages

  Dynamically loads all handler in the websocket.handler directory
  """
  def __init__(self):
    self._handlers: Dict[str, HandlerBase] = {}
    messageHandlerDir =  Path(__file__).parent


    for file_name in messageHandlerDir.glob(handler_file_glop_pattern):
      if file_name.name == '__init__.py':
        continue

      module = import_module(f"websocket.handler.{file_name.name[:-3]}", "")

      for class_name, obj in getmembers(module, isclass):
        if obj is HandlerBase:
          continue

        if issubclass(obj, HandlerBase):
          try:
            instance = obj()
          except TypeError:
            raise ValueError(f"{class_name} has abstract method __call__ and can't be created!")

          if instance.message_type == BASE_MESSAGE_TYPE:
            raise ValueError(f"{class_name} has the default message type!")

          if instance.message_type in self._handlers:
            raise ValueError(f"Duplicate handler for {instance.message_type}!")

          self._handlers[instance.message_type] = instance
    missing_message_types = [ mt for mt in WEBSOCKET_MESSAGE_TYPES if mt not in self._handlers]

    if missing_message_types: # pragma: no cover
      raise ValueError(f"Message Handler is missing {missing_message_types}")

  def __str__(self):
    return f"MessageHandler with keys {[k for k in self._handlers]} created"

  async def __call__(self, consumer: 'consumer.Consumer', message):
    if WEBSOCKET_MESSAGE_TYPE not in message:
      raise Exception

    message_type = message[WEBSOCKET_MESSAGE_TYPE]
    if message_type not in self._handlers:
      raise Exception

    handler = self._handlers[message_type]

    await handler(consumer, message)

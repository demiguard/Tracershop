
# Python standard library
from logging import getLogger
from typing import Any, Dict, List, Type

# Tracershop Standard
from constants import ERROR_LOGGER

error_logger = getLogger(ERROR_LOGGER)

class GenericType:
  def validate(self, obj) -> bool:
    raise NotImplemented # pragma: no cover

class Array[T](GenericType):
  def __init__(self, array_type: Type[T]) -> None:
    super().__init__()

    self.array_type = array_type

  def validate(self, obj) -> bool:
    if not isinstance(obj, List):
      return False

    for member in obj:
      if not isinstance(member, self.array_type):
        return False

    return True

type JsonBlueprint = Dict[str, Type | GenericType | JsonBlueprint]

class Message:
  def __init__(self, message_blueprint: JsonBlueprint) -> None:
    self.blueprint = message_blueprint

  def __iter__(self):
    for [key, value] in self.blueprint.items():
      yield key, value

  def __str__(self):
    message = "{\n"

    for [key, value] in self:
      value_str = str(value)
      message += f"  {key} : {value_str}"

    message += "}\n"

    return message


def validate_message(message: Dict[str, Any], blueprint: Message) -> bool:
  for key, value in blueprint:
    if key not in message:
      error_logger.error(f"key: {key} is missing in {message}")
      return False

    if isinstance(value, GenericType):
      if not value.validate(message[key]):
        error_logger.error(f"key: {key} is invalid in {message}")
        return False
    elif isinstance(value, Dict):
      if not isinstance(message[key], Dict):
        error_logger.error(f"Key: {key} should be a Dict, but it's not")
        return False
      if not validate_message(message[key], Message(value)):
        return False
    elif isinstance(value, Type):
      if not isinstance(message[key], value):
        error_logger.error(f"key: {key} in message is not type {value}")
        return False
    else: # pragma: no cover
      print(f"Missed a case: {key}")

  return True

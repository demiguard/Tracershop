from typing import Any, Dict, List, Type

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

def validate_message(message: Dict[str, Any], blueprint: Message) -> bool:
  for key, value in blueprint:
    if key not in message:
      return False

    if isinstance(value, GenericType):
      if not value.validate(message[key]):
        return False
    elif isinstance(value, Dict):
      if not isinstance(message[key], Dict):
        return False
      if not validate_message(message[key], Message(value)):
        return False
    elif isinstance(value, Type):
      if not isinstance(message[key], value):
        return False
    else: # pragma: no cover
      print(f"Missed a case: {key}")

  return True
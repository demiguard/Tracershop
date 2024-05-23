"""This module is for defining custom types used in the tracerauth app."""

__author__ = "Christoffer Vilstrup Jensen"

# This module should not contain functionality to prevent circular imports

# Python standard Library
from enum import Enum
from typing import Any, Callable, Dict, List, TypeVar

T = TypeVar('T')
P = TypeVar('P')

# Third party Libraries / modules

# Tracershop modules

class AuthActions(Enum):
  REJECT_LOG = 1
  REJECT = 2
  ACCEPT_LOG = 3
  ACCEPT = 4

  @property
  def should_log(self) -> bool:
    return self in [AuthActions.REJECT_LOG, AuthActions.ACCEPT_LOG]

  @property
  def should_act(self):
    return self in [AuthActions.ACCEPT, AuthActions.ACCEPT_LOG]

  def __and__(self, action: 'AuthActions'):
    should_log = self.should_log or action.should_log
    should_act = self.should_act and action.should_act

    if should_log:
      if should_act:
        return AuthActions.ACCEPT_LOG
      else:
        return AuthActions.REJECT_LOG
    if should_act:
      return AuthActions.ACCEPT
    else:
      return AuthActions.REJECT

  def __bool__(self) -> bool:
    return self.should_act


class AuthenticationResult(Enum):
  SUCCESS = 0
  INVALID_PASSWORD = 1
  MISS_MATCH_USERNAME = 2


# This is used for message validation
class MessageField:
  __slots__ = ('_required', '_name', '_type')

  def __init__(self, name: str, field_type: Callable[[P], T], required=True) -> None:
    self._name = name
    self._type = field_type
    # Note that this doesn't have to be a type, this is very useful when such
    # an object is constructable from a single value, such as dates for example
    self._required = required

  @property
  def name(self):
    return self._name

  def validate(self, value) -> T:
    """

    Args:
        value (_type_): _description_

    Throws:


    Returns:
        T: _description_
    """
    return self._type(value)

class MessageObjectField(MessageField):
  pass

class MessageType:
  def __init__(self, name, fields: List[MessageField]) -> None:
    self._name = name
    self._fields = {}
    for field in fields:
      self._fields[field.name] = field

  def __getitem__(self, key):
    if key not in self._fields:
      raise KeyError
    return self._fields[key]

class Message:
  def __init__(self, messageType: MessageType, skeleton: Dict[str, Any]) -> None:
    pass

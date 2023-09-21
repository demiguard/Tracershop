"""This module is for defining custom types used in the tracerauth app."""

# This module should not contain functionality to prevent circular imports

# Python standard Library
from enum import Enum

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
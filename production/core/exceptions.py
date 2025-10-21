from datetime import time
from typing import Optional

class ContractBroken(Exception):
  """This error indicates there have been a regression, which introduces a
     contract violation!
  """

class DatabaseNotSetupException(Exception):
  pass

class DatabaseCouldNotConnect(Exception):
  pass

class DatabaseInvalidQueriesConfiguration(Exception):
  pass

class IllegalActionAttempted(Exception):
  pass

class RequestingNonExistingEndpoint(Exception):
  def __init__(self, booking_start_time : time, earliest_available_order_time: Optional[time], *args):
    super().__init__(*args)
    self.booking_start_time = booking_start_time
    self.earliest_available_order_time = earliest_available_order_time

class UndefinedReference(Exception):
  pass

class EmptyFile(Exception):
  pass

class InvalidCSVFile(Exception):
  pass

class UnknownUnit(Exception):
  pass

class LoginRequired(Exception):
  """Raised when an action requires a user to be logged in, but there isn't"""
  pass

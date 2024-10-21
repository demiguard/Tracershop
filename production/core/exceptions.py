from datetime import time
from typing import Optional

class SecurityException(Exception):
  def __init__(self, SecurityType):

    self.message = f"Security Issue encountered: {SecurityType}"

    super().__init__(self.message)


class SQLInjectionException(SecurityException):
  def __init__(self):
    super().__init__("SQL Injection Detected")


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
"""This module contains classes which have things, that various side effects
The idea is that these classes can easily be mocked and injected in the place
where side effects are needed.
"""

# Python Standard library
import datetime

# Third Party Library

# Tracershop Modules


class DateTimeNow():
  def now(self) -> datetime.datetime:
    return datetime.datetime.now()
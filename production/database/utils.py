from functools import wraps
from typing import Callable
from random import random
from time import sleep


from django.db.utils import OperationalError

def retryDecorator(func: Callable) -> Callable:
  """_summary_

  Args:
      func (Callable): _description_

  Returns:
      Callable: _description_
  """
  max_retries = 5

  @wraps(func)
  def wrapper(*args, **kwargs):
    for attempt in range(max_retries):
      try:
        return func(*args, **kwargs)
      except OperationalError:
        delay_seconds = 1 + random() / 1_000
        sleep(delay_seconds ** (attempt + 1))

  return wrapper

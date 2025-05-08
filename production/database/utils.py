from functools import wraps
from typing import Callable
from random import random
from time import sleep


from django.db.utils import OperationalError
from django.core.exceptions import ValidationError
from django.db.models import Model

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

def can_be_saved(model: Model) -> bool:
  """This is a full_clean method and an exception extractor, because you know
  return values do not exists :(

  Modifies the model as if they called full_clean on themselves.

  Args:
      model (Model): The model to be verified.

  Returns:
      bool: True if the model is clean and therefore can be saved, False otherwise
  """
  try:
    model.full_clean()
    return True
  except ValidationError:
    return False
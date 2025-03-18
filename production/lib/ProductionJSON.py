""" module for converting json stuff

"""
__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from logging import getLogger
from enum import Enum
import json
from typing import Dict

# Thrid party Packages
from django.core.serializers.json import DjangoJSONEncoder

from django.db.models import Model
from django.core.serializers import serialize
from django.core.exceptions import ValidationError

# Tracershop Packages
from constants import ERROR_LOGGER
error_logger = getLogger(ERROR_LOGGER)

class ProductionJSONEncoder(DjangoJSONEncoder):
  def default(self, o):
    if isinstance(o, Model):
      stuff = serialize('json', [o])
      return stuff[1:-1]
    if isinstance(o, Enum):
      return o.value
    if isinstance(o, ValidationError):
      return o.message

    return super().default(o)

def encode(text_data):
  return json.dumps(text_data, cls=ProductionJSONEncoder)

def decode(content: str) -> Dict:
  """Decodes a string as many times as needed to get a python object

  Args:
      content (str): A json encoded string any number of times

  Returns:
      Dict: Json dict with the appropriate values
  """
  iteratorContent = content
  decoding_count = 0
  while type(iteratorContent) == str:
    iteratorContent = json.loads(iteratorContent)
    decoding_count += 1
  if decoding_count > 1: # pragma no cover
    error_logger.warning(f"Unnecessary encoding detected of {content}")
  if isinstance(iteratorContent, Dict):
    return iteratorContent
  else:
    raise ValueError(f"Unable to convert \"{content}\" to a json object")

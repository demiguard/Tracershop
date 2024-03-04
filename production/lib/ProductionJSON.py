"""
  JSON module for production

"""
__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from enum import Enum
import json
from typing import Dict

# Thrid party Packages 
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse
from django.db.models import Model
from django.core.serializers import serialize

# Tracershop Packages


class ProductionJSONEncoder(DjangoJSONEncoder):
  def default(self, o):
    if isinstance(o, Model):
      stuff = serialize('json', [o])
      return stuff[1:-1]
    if isinstance(o, Enum):
      return o.value

    return super().default(o)

class ProductionJSONResponse(JsonResponse):
  def __init__(self, data, encoder=ProductionJSONEncoder, safe=True,
                 json_dumps_params=None, **kwargs):
    super().__init__(data, encoder=encoder,safe=safe, json_dumps_params=json_dumps_params, **kwargs)

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
  while type(iteratorContent) == str:
    iteratorContent = json.loads(iteratorContent)
  if type(iteratorContent) == dict:
    return iteratorContent

"""
  JSON module for production

  This module focuses on custom conversion between the different
  Production Specific Classes 

"""
__author__ = "Christoffer Vilstrup Jensen"

from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse
from django.db.models import Model

from lib.ProductionDataClasses import JsonSerilizableDataClass

from typing import Dict
import json

class ProductionJSONEncoder(DjangoJSONEncoder):
  def default(self, o):
    if isinstance(o, Model):
      return str(o)
    if isinstance(o, JsonSerilizableDataClass):
      responseStr = '{\n'
      fields = [ field.name for field in o.getFields()]
      oDict = o.toDict()
      for i,field in enumerate(fields):
        if i != len(fields) - 1:
          responseStr += f'  "{field}": {self.encode(oDict[field])},\n'
        else:
          responseStr += f'  "{field}": {self.encode(oDict[field])}\n'  
      responseStr += '}'
      return responseStr

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

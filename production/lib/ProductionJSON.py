"""
  JSON module for production

  This module focuses on custom conversion between the different
  Production Specific Classes 

"""
__author__ = "Christoffer Vilstrup Jensen"

from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse

from lib.ProductionDataClasses import JsonSerilizableDataClass

import json

class ProductionJSONEncoder(DjangoJSONEncoder):
  def default(self, o):
    if isinstance(o, JsonSerilizableDataClass):
      responseStr = '{\n'
      fields = o.getFields()
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

def decode(content):
  return json.loads(content)

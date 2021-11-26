"""
  JSON module for production

  This module focuses on custom conversion between the different
  Production Specific Classes 

"""
__author__ = "Christoffer Vilstrup Jensen"

from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse

from lib.ProductionDataClasses import JsonSerilizableDataClass


class ProductionJSONEncoder(DjangoJSONEncoder):
  def default(self, o):
    if isinstance(o, JsonSerilizableDataClass):
      return super().encode(o.toDict())

    return super().default(o)

class ProductionJSONResponse(JsonResponse):
  def __init__(self, data, encoder=ProductionJSONEncoder, safe=True,
                 json_dumps_params=None, **kwargs):
    super().__init__(data, encoder=encoder,safe=safe, json_dumps_params=json_dumps_params, **kwargs)
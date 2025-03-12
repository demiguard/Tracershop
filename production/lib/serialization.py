# Python standard library
from datetime import date, datetime, time
from enum import Enum
from typing import Any, Dict

# Third party Library
from django.core.serializers import serialize
from django.db.models import QuerySet
from channels.db import database_sync_to_async

# Tracershop packages
from constants import DATE_FORMAT, DATETIMEZONE_FORMAT, TIME_FORMAT
from database.models import TracershopModel

def serialize_value(value: Any) -> Any:
  match value:
    case QuerySet():
      return [
        serialize_value(m) for m in value
      ]
    case TracershopModel():
      serialized_model, = serialize('python', [value])

      fields: Dict[str, Any] = serialized_model['fields']

      for key in value.exclude:
        del fields[key]

      for key in fields:
        fields[key] = serialize_value(fields[key])

      for property_name in value.derived_properties:
        fields[property_name] = serialize_value(
          getattr(value, property_name)
        )
      return serialized_model

    case dict():
      return serialize_redis(value)
    case list():
      return [serialize_value(v) for v in value]
    case Enum():
      return value.value
    case datetime():
      return value.strftime(DATETIMEZONE_FORMAT)
    case date():
      return value.strftime(DATE_FORMAT)
    case time():
      return value.strftime(TIME_FORMAT)
    case _:
      return value


def serialize_redis(message : Dict):
  for key,value in message.items():
    message[key] = serialize_value(value)
  return message

@database_sync_to_async
def a_serialize_redis(message):
  return serialize_redis(message)

"""This file is for serializing models"""

# Standard Python Library
from enum import Enum
from typing import Iterable, Union
# Third party packages

# Tracershop Packages
from database.models import TracershopModel

class SerializationOutputs(Enum):
  DJANGO : 0
  TRACERSHOP : 1


def serialize_model(model: Union[Iterable[TracershopModel], TracershopModel], output=SerializationOutputs.DJANGO):
  pass
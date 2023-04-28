""""""

# Python standard library
from dataclasses import dataclass
from typing import Dict
# Third party library

# Tracershop production packages
from database.models import DatabaseType
from dataclass.json_dataclass import TypeSafeJsonDataclass


@dataclass(init=False)
class DatabaseDataclass(TypeSafeJsonDataclass):
  """This

  Args:
      TypeSafeJsonDataclass (_type_): _description_
  """
  _SQLTable: str

  _database_mapping: Dict[DatabaseType, Dict[str, str]] = {

  }




"""
  SQL Formatter

  This module transforms Query results into more accessable dataformats than
  the default tuples that come out of the MYSQL connector module.

  Yes, I know there's a build in function such that you can pull out the table names
  by the queries, however this allows for better renaming. Either way if you wanna be
  Smart about and Implement something that uses the table names instead have a look at:
  https://docs.djangoproject.com/en/3.1/topics/db/sql/
"""
__author__ = "Christoffer Vilstrup Jensen"

import re
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime, date, time

from lib.Formatting import dateConverter, timeConverter , datetimeConverter
from lib.expections import SQLInjectionException

def FormatSQLDictAsClass(SQLResult: List[Tuple], cls):
  """
    This function converts a list of tuples queried from the database into a list
  """
  if SQLResult:
    return list(map(lambda ClassTuple : cls(**ClassTuple), SQLResult))
  else:
    return []


def checkForSQLInjection(SQLquery : str):
  """
    Checks for common SQL injeciton patterns
    Raises SQLInjecitonException if it finds one
  """
  regex = re.compile(r";|--\%")

  if regex.search(SQLquery):
    raise SQLInjectionException()

def SerilizeToSQLValue(value : Any, NoneTypeRes: Any ="\"\"") -> Any:
  """This function converts a value to be inserted into the database.

  Args:
      value (Any): [description]

  KWArgs:
      NoneTypeRes (Any): This is the return value if the value is None

  Raises:
      TypeError: On an unsupported type it raises an TypeError

  Returns:
      Any: returns a value ready to be inserted into the database by a format string. Type is dependant on input type
  """
  valueType = type(value)
  if valueType == int:
    return value
  if valueType == float:
    return value
  if valueType == str:
    return f"\"{value}\""
  if valueType == date:
    return f"\"{dateConverter(value)}\""
  if valueType == time:
    return f"\"{timeConverter(value)}\""
  if valueType == datetime:
    return f"\"{datetimeConverter(value)}\""
  if valueType == type(None):
    return NoneTypeRes
  if valueType == bool:
    return int(value)
  raise TypeError(f"Value of unknown type: {valueType}")

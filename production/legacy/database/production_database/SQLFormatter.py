"""SQL Formatter

  This module transforms Query results into more accessable dataformats than
  the default tuples that come out of the MYSQL connector module.

  Yes, I know there's a build in function such that you can pull out the table names
  by the queries, however this allows for better renaming. Either way if you wanna be
  Smart about and Implement something that uses the table names instead have a look at:
  https://docs.djangoproject.com/en/3.1/topics/db/sql/
"""
__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import datetime, date, time
import re
from typing import List, Tuple, Dict, Any, Optional, Type

# Third Party Packages
#from dataclass.ProductionDataClasses import JsonSerilizableDataClass

# Tracershop production packages
from lib.Formatting import dateConverter, timeConverter , datetimeConverter
from core.exceptions import SQLInjectionException



def FormatSQLDictAsClass(SQLResult: List[Dict[str, Any]], cls: Type['JsonSerilizableDataClass']):
  """
    This function converts a list of tuples queried from the database into a list
  """
  if SQLResult:
    return [cls(**ClassTuple) for ClassTuple in SQLResult]
  else:
    return []


def checkForSQLInjection(Query : str):
  """Checks for common SQL injeciton patterns
    Raises SQLInjectionException if it finds one

    Args:
      Query (str): SQL-Query to be checked if it's a malicious query.

    Raises:
      SQLInjectionException: If an SQLInjection is found
  """
  regex = re.compile(r";|--\%")

  if regex.search(Query):
    raise SQLInjectionException()

def SerializeToSQLValue(value : Any, NoneTypeRes: Any ="\"\"") -> Any:
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

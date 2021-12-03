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
from typing import List, Tuple, Dict, Any
from datetime import datetime, date, time
from lib.Formatting import dateConverter, timeConverter , datetimeConverter


from lib.expections import SQLInjectionException
from lib.ProductionDataClasses import JsonSerilizableDataClass

def FormatSQLTuple(SQLQuery : List[Tuple], names : List[str]) -> List[Dict]:
  """
    This function takes a list of tuples and converts it into a list of dicts
    with the names from the arguments.

    Names should have the same length as the tuple. 
    The final list of length equal to SQL query
    
    Args:
      SQLQuery : List[Tuple]
      names    : List[Str]
    Return
      List[Dict] - The tuples converted to dicts

    Example:
      >>>FormatSQLTuple([(1,2), (2,3)],["a","b"])
      [{"a" : 1, "b" : 2 }, {"a" : 2, "b" : 3 }]
    
  """
  return [ 
    { name : query[i] for (i, name) in enumerate(names) } 
      for query in SQLQuery
  ]

def FormatSQLTupleAsClass(SQLResult: List[Tuple], cls : JsonSerilizableDataClass) -> List[JsonSerilizableDataClass]:
  """
    This function converts a list of tuples queried from the database into a list


  """
  return list(map(lambda ClassTuple : cls(*ClassTuple), SQLResult))


def checkForSQLInjection(SQLquery : str):
  """
    Checks for common SQL injeciton patterns 
    Raises SQLInjecitonException if it finds one
  """
  
  regex = re.compile(r";|--\%")
  
  if regex.search(SQLquery):
    raise SQLInjectionException()

def SerilizeToSQLValue(value : Any) -> Any:
  valueType = type(value)
  if valueType == int:
    return value
  if valueType == float:
    return value
  if valueType == str:
    return f"\"{value}\""
  if valueType == date:
    return f"\"{dateConverter(value)}\""
  if value == time:
    return f"\"{timeConverter(value)}\""
  if value == datetime:
    return f"\"{datetimeConverter(value)}\""
  raise TypeError(f"Value of unknown type: {valueType}")


  

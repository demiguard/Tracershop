"""
  Yes, I know there's a build in function such that you can pull out the table names
  by the queries, however this allows for better renaming. Either way if you wanna be
  Smart about and Implement something that uses the table names instead have a look at:
  https://docs.djangoproject.com/en/3.1/topics/db/sql/
"""

import re

from lib.expections import SQLInjectionException


def FormatSQLTuple(SQLQuery : list, names : list) -> list:
  """
    This function takes a list of tuples and converts it into a list of dicts
    with the names from the arguments.

    Names should have the same length as the tuple. 
    The final list of length equal to SQL query

    Example:
    FormatSQLTuple([(1,2), (2,3)],["a","b"]) ->
      [{"a" : 1, "b" : 2 }, {"a" : 2, "b" : 3 }]
    
    Programmers Note:

    Yes it's Stupid python magic
  """
  return [ 
    { name : query[i] for (i, name) in enumerate(names) } 
      for query in SQLQuery
  ]


def checkForSQLInjection(SQLquery : str):
  """
    Checks for common SQL injeciton patterns 
    Raises SQLInjecitonException if it finds one
  """
  
  regex = re.compile(r";|--\%")
  
  if regex.search(SQLquery):
    raise SQLInjectionException()
  

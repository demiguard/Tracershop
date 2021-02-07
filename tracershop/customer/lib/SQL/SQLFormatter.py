"""
  Yes, I know there's a build in function such that you can pull out the table names
  by the queries, however this allows for better renaming. Either way if you wanna be
  Smart about and Implement something that uses the table names instead have a look at:
  https://docs.djangoproject.com/en/3.1/topics/db/sql/
"""
from customer import constants
from customer.lib import calenderHelper

def FormatSQLTuple(SQLQuery, names) -> list:
  """
    Yes it's Stupid
  """
  return [ 
    { name : query[i] for (i, name) in enumerate(names) } 
      for query in SQLQuery
  ]

def FormatMonthlyOrders(SQLQueries) -> dict:
  return dict(map(lambda query: (str(query[0]), query[1]), SQLQueries))

def mapTimeDeltasToTime(SQLQueries: list, key:str) -> list:
  for query in SQLQueries:
    query[key] = calenderHelper.timedeltaToTime(query[key])
  return SQLQueries

def MonthlyDirectory(dates):
  returnDict = {}
  for date in dates:
    returnDict[date[0].strftime("%Y-%m-%d")] = True
  return returnDict

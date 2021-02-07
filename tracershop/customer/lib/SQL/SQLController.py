from django.db import connection

from typing import Type
from datetime import datetime, time, date


from customer import constants
from customer.lib import calenderHelper
from customer.lib.SQL import SQLFormatter, SQLExecuter, SQLFactory
from customer.models import PotentialUser


def queryOrderByMonth(year : int,month : int, userID : int) -> list:
  SQLQuery       = SQLFactory.createSQLQueryOrderStatusByMonth(year, month, userID)
  QueryResult    = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return           SQLFormatter.FormatMonthlyOrders(QueryResult)
  
  

def queryTOrderByMonth(year:int, month : int, userID : int) -> list:
  SQLQuery       = SQLFactory.createSQLQueryTOrderStatusByMonth(year, month, userID)
  QueryResult    = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return           SQLFormatter.FormatMonthlyOrders(QueryResult)


def queryOrderByDate(date, userID : int ) -> list:
  """
    Queries for orders for a specific date
  """
  SQLQuery       = SQLFactory.createSQLQueryOrdersByDay(date, userID)
  QueryResult    = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  FormattedQuery = SQLFormatter.FormatSQLTuple(
    QueryResult,
    constants.SQLTuples[constants.FTGORDER]
  )

  return FormattedQuery

def getDailyRuns(date, userID) -> list:
  SQLQuery       = SQLFactory.createSQLQueryDailyRuns(date, userID)
  QueryResult    = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  deltaTimeQuery = SQLFormatter.FormatSQLTuple(
    QueryResult,
    constants.SQLTuples[constants.DAILYRUNS]
  )
  FormattedQuery = SQLFormatter.mapTimeDeltasToTime(deltaTimeQuery, 'dtime')
  return FormattedQuery

def getClosed(date) -> bool:
  """
    Determines if production have closed on a specific day

    Args:
      date: string on format YYYY-MM-DD, datetime.date or datetime.datetime obejcts 
  """
  SQLQuery = SQLFactory.createSQLQueryClosedDate(date)
  openOrClosed = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)

  if openOrClosed == 1:
    return True
  return False

def get_unverified_users() -> list: 
  return list(PotentialUser.objects.all())


def getMaxCustomerNumber() -> int:
  SQLQuery = SQLFactory.createSQLQueryMaxCustomerNumber()
  CustomerNumbers = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  return max(CustomerNumbers)
  

def insertOrderFTG(
      amount      : int,
      deliverTime : Type[time],
      dato        : Type[date],
      comment     : str,
      userID      : int
    )      -> None:

  SQLQuery = SQLFactory.createSQLQueryInsertFTGOrder(
    amount, deliverTime, dato, comment, userID )
  SQLExecuter.ExecuteQuery(SQLQuery)

def insertTOrder(
    injections : int,
    deliver_datetime : Type[datetime],
    tracerID   : int,
    usage      : str,
    userID     : int
    ) -> None:

  SQLQuery = SQLFactory.createSQLQUeryInsertTOrder(
    userID, deliver_datetime,tracerID, injections, usage
  )
  SQLExecuter.ExecuteQuery(SQLQuery)

def getLastOrder() -> int: 
  SQLQuery = SQLFactory.createSQLQueryMaxOrderID()
  return SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  
def getLastTOrder() -> int:
  SQLQuery = SQLFactory.createSQLQueryMaxTOrderID()
  return SQLExecuter.ExecuteQueryFetchOne(SQLQuery)


def getTOrdersForms(userID: int) -> list:
  SQLQuery  = SQLFactory.createSQLQueryTOrderForms(userID)
  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  tupleNames = constants.TORDERFORMS
  nameDir    = constants.SQLTuples

  return SQLFormatter.FormatSQLTuple(SQLResult, nameDir[tupleNames]) 

def getDailyTOrders(date, userID:int) -> list:
  SQLQuery = SQLFactory.createSQLQueryTOrders(date, userID)
  TOrders  = SQLExecuter.ExecuteQueryFetchAll(SQLQuery) 

  tupleNames = constants.TORDERS
  nameDir    = constants.SQLTuples

  return SQLFormatter.FormatSQLTuple(TOrders, nameDir[tupleNames])

def getActiveCustomers() -> list:
  SQLQuery = SQLFactory.createSQLQueryActiveCustomers()
  ActiveCustomers = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)


  tupleName = constants.ACTIVECUSTOMER
  nameDir    = constants.SQLTuples

  return SQLFormatter.FormatSQLTuple(ActiveCustomers, nameDir[tupleName])

def monthlyCloseDates(year:int, month:int):
  SQLQuery = SQLFactory.createSQLQueryMonthlyClosedDates(year, month)
  closedDates = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  if closedDates:
    return SQLFormatter.MonthlyDirectory(closedDates)
  else:
    return {}


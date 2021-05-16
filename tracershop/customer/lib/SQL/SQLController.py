from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from typing import Type
from datetime import datetime, time, date

from customer import constants
from customer.lib import calenderHelper
from customer.lib.SQL import SQLFormatter, SQLExecuter, SQLFactory
from customer.models import User, PotentialUser, ServerConfiguration, Database, Customer, Location


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

def get_users() -> list: 
  return list(User.objects.all())


def getMaxCustomerNumber() -> int:
  SQLQuery = SQLFactory.createSQLQueryMaxCustomerNumber()
  CustomerNumbers = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  return max(CustomerNumbers)
  

def insertOrderFTG(
      amount      : int,
      comment     : str,
      deliverTime : Type[time],
      dato        : Type[date],
      run         : int, 
      userID      : int,
      username    : str
    )      -> None:


  overhead = getCustomerOverhead(userID)
  if overhead:
    AmountOverhead = int(amount * (1 + overhead / 100))
  else:
    AmountOverhead = amount


  SQLQuery = SQLFactory.createSQLQueryInsertFTGOrder(
    amount,
    AmountOverhead,
    comment,
    deliverTime,
    dato,
    run,
    userID,
    username
  )
     
  SQLExecuter.ExecuteQuery(SQLQuery)

def insertTOrder(
    injections : int,
    deliver_datetime : Type[datetime],
    tracerID   : int,
    usage      : str,
    userID     : int,
    username   : str,
    comment    : str
    ) -> None:

  SQLQuery = SQLFactory.createSQLQUeryInsertTOrder(
    userID, deliver_datetime,tracerID, injections, usage, username, comment
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
  """
    Retrives the closed Dates from External Database

    Args:
      Year: The Year in question for which the query is targeted
      Month: The Month in question for which the Query is targeted
  
    Returns:
      A dict on the format
        {"Date" : 1}
      Use codesnippet to detect if the day is closed:
         if Dict.get(Date):
           #Code
  """  
  SQLQuery = SQLFactory.createSQLQueryMonthlyClosedDates(year, month)
  closedDates = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  if closedDates:
    return SQLFormatter.MonthlyDirectory(closedDates)
  else:
    return {}


def getOpenDays(userID):
  SQLQuery = SQLFactory.createSQLAvailbleFDGDays(userID)
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery) 
  return SQLFormatter.FormatDaysList(QueryResult)

def getPotentialUsers():
  return list(PotentialUser.objects.all())

#These function is mainly to make code there to make it testable, because you can mock stuff up with it
def getAll(Model):
  return Model.objects.all()

def getSpecificObject(ID, Obejct ):
  return Obejct.objects.get(ID=ID) 


def getServerConfig():
  """

    This Functions gets the serverConfig, if it doesn't exists it 
  
  """
  try:
    ServerConfig = ServerConfiguration.objects.get(ID=1)
  except ObjectDoesNotExist:
    Databases    = Database.objects.all()
    ServerConfig = ServerConfiguration(ID=1, ExternalDatabase=Databases[0])
    ServerConfig.save()

  return ServerConfig

def updateFDGOrder(OrderID, NewAmount, NewComment, customerID):
  overhead = getCustomerOverhead(customerID)
  if overhead:
    overheadAmount = int(NewAmount * (1 + overhead / 100))
  else:
    overheadAmount = NewAmount
  SQLQuery = SQLFactory.createSQLUpdateFDG(OrderID, NewAmount, overheadAmount, NewComment)
  SQLExecuter.ExecuteQuery(SQLQuery)

def deleteFDGOrder(OrderID):
  SQLQuery = SQLFactory.createSQLDeleteFDG(OrderID)
  SQLExecuter.ExecuteQuery(SQLQuery)

def getCustomerOverhead(customerID):
  """
    Cache to allow sloppy programming
  """
  SQLQuery = SQLFactory.createSQLGetOverhead(customerID)
  overhead = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  return overhead[0]

def getTOrderStatusOrderTime(OrderID):
  SQLQuery = SQLFactory.createSQLGetTorderDate(OrderID)
  status, order_dateTime = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  return status, order_dateTime

def updateTOrder(OrderID, NewComment, NewInjections, NewUse):
  pass

def deleteTOrder(OrderID):
  SQLQuery = SQLFactory.createSQLDeleteTOrder  



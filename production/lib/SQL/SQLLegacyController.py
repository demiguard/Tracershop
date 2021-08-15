"""
  The Idea behind this class to be the only link to the legacy database.
  In other word this class is an interface for communication between the 
  different Tracershop apps. 
"""
from datetime import timedelta, time

from lib import Formatting
from lib.SQL import SQLExecuter, SQLFormatter

def getCustomers():
  SQLQuery = """
    SELECT 
      Users.Username, 
      Users.Id,
      Users.overhead
    FROM 
      Users
      INNER JOIN UserRoles on
        Users.Id = UserRoles.Id_User
    WHERE
      UserRoles.Id_Role = 4
  """


  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  names = ["UserName", "ID", "overhead"]
  return SQLFormatter.FormatSQLTuple(SQLResult, names)
  
def getCustomer(ID):
  SQLQuery = f"""
    SELECT 
      EMail,
      EMail2,
      EMail3, EMail4, overhead, kundenr, contact, tlf
    FROM
      Users
    Where
      Id={ID}
  """
  EMail1, EMail2, EMail3, EMail4, overhead, kundenr, contact, tlf  = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  
  if EMail1 == None  : EMail1 = ""
  if EMail2 == None  : EMail2 = ""
  if EMail3 == None  : EMail3 = ""
  if EMail4 == None  : EMail4 = ""
  if contact == None : contact = ""
  if not tlf         :  
    tlf = ""   
  else:
    tlf = str(tlf)

  return {
    "EMail1" :   EMail1,
    "EMail2" :   EMail2,
    "EMail3" :   EMail3,
    "EMail4" :   EMail4,
    "overhead" : overhead,
    "kundenr" :  kundenr,
    "contact":   contact,
    "tlf": tlf
  }


def getCustomerDeliverTimes(ID):
  SQLQuery = f"""
    SELECT 
      deliverTimes.day,
      repeat_t,
      TIME_FORMAT(dtime, \"%T\"),
      max, 
      run, 
      DTID
    FROM
      Users
      INNER JOIN deliverTimes ON Users.ID=deliverTimes.BID
    Where
      Users.Id={ID}
    ORDER BY
      deliverTimes.day,
      deliverTimes.dtime
  """
  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  result = {
    "days" : [],
    "repeat_t" : [],
    "dtime" : [],
    "max"   : [],
    "run" : [],
    "DTID" : []
  }

  for day, repeat_t, dtime, maxOrder, run, DTID in SQLResult:
    result["days"].append(day)
    result["repeat_t"].append(repeat_t)
    result["dtime"].append(dtime)
    result["max"].append(maxOrder)
    result["run"].append(run)
    result["DTID"].append(DTID)

  return result

def getTorderMonthlyStatus(year : int, month : int):
  month = Formatting.convertIntToStrLen2(month)
  SQLQuery = f"""
  SELECT DISTINCT
    DATE(deliver_datetime),
    status
  FROM t_orders
  WHERE
    CONVERT (DATE(deliver_datetime), CHAR) Like '{year}-{month}-%'
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return {
    statusPair[0] : statusPair[1] * 10 for statusPair in QueryResult
  }


def getOrderMonthlyStatus(year : int, month : int):
  month = Formatting.convertIntToStrLen2(month)
  SQLQuery = f"""SELECT DISTINCT 
    DATE(deliver_datetime),
    status
  FROM orders
  WHERE 
    CONVERT(DATE(deliver_datetime), CHAR) LIKE '{year}-{month}-%'
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return {
    statusPair[0] : statusPair[1] for statusPair in QueryResult
  }

def getDailyOrders(DT):
  SQLQuery = f"""
    SELECT

    FROM
      orders
    WHERE
      DATE(deliver_datetime) 
  """

def getTracers():
  SQLQuery = f"""
    SELECT 
      id,
      name,
      isotope, 
      n_injections,
      order_block
    FROM
      Tracers
  """
  result = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  returnDict = {
    "TID" : [],
    "name" : [],
    "isotope" : [],
    "inj"  : [], 
    "block" : []
  }

  for (TID, name, isotope, inj, block) in result:
    returnDict["TID"].append(TID)
    returnDict["name"].append(name)
    returnDict["isotope"].append(isotope)
    returnDict["inj"].append(inj)
    returnDict["block"].append(block)
  return returnDict
  

def getIsotopes():
  SQLQuery = f"""SELECT  
    id,
    name
  FROM
    isotopes
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return {
    IsotopePair[0] : IsotopePair[1] for IsotopePair in QueryResult
  }


def getFDGOrders(year:int, month: int, day : int):
  month = Formatting.convertIntToStrLen2(month)
  day   = Formatting.convertIntToStrLen2(day)
  SQLQuery = f"""
    SELECT
      deliver_datetime,
      OID,
      status,
      amount,
      amount_o,
      total_amount,
      total_amount_o,
      run,
      BID,
      batchnr,
      COID
    FROM
      orders 
    WHERE
      deliver_datetime LIKE \"{year}-{month}-{day}%\"
    ORDER BY
      BID,
      deliver_datetime
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult,[
    "deliver_datetime",
    "oid",
    "status",
    "amount",
    "amount_o",
    "total_amount",
    "total_amount_o",
    "run",
    "BID",
    "batchnr",
    "COID"
  ])


def setFDGOrderStatusTo2(oid:int):
  SQLQuery = f"""
    UPDATE orders
    SET status = 2
    WHERE
      OID = {oid}
  """
  SQLExecuter.ExecuteQuery(SQLQuery)


def getRuns():
  SQLQuery = f"""
    SELECT 
      day,
      TIME_FORMAT(ptime, \"%T\"), 
      run
    FROM 
      productionTimes
    ORDER BY
      day, ptime
  """

  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult, ["day", "ptime", "run"])


def getProductions():
  SQLQuery = f"""
    SELECT 
      BID, 
      day,
      repeat_t,
      TIME_FORMAT(dtime, \"%T\"),
      run
    FROM 
      deliverTimes
    ORDER BY
      BID, day, dtime
  """

  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult, [
    "BID",
    "day",
    "repeat",
    "dtime",
    "run" 
  ])

def UpdateOrder(Order : dict):
  
  SQLQuery = f"""
    UPDATE orders
    SET
      status = {Order["status"]},
      total_amount = {Order["total_amount"]},
      total_amount_o = {Order["total_amount_o"]},
      run = {Order["run"]},
      batchnr = \"{Order["batchnr"]}\", 
      COID = {Order["COID"]}
    WHERE
      OID = {Order["oid"]}
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

def getTOrders(year : int, month : int, day :int):
  month = Formatting.convertIntToStrLen2(month)
  day   = Formatting.convertIntToStrLen2(day)
  SQLQuery = f"""
    SELECT 
      t_orders.deliver_datetime,
      t_orders.OID,
      t_orders.status,
      t_orders.n_injections,
      t_orders.anvendelse,
      t_orders.comment,
      Users.Username,
      Tracers.name
    FROM
      t_orders 
        INNER JOIN Tracers on t_orders.tracer = Tracers.id
        INNER JOIN Users   on t_orders.BID    = Users.Id
    WHERE 
      t_orders.deliver_datetime LIKE \"{year}-{month}-{day}%\"
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  return SQLFormatter.FormatSQLTuple(QueryResult, [
    "deliver_datetime",
    "oid",
    "status",
    "injections",
    "usage",
    "comment",
    "username",
    "tracer"
  ])

def setTOrderStatus(oid, status):
  
  SQLQuery = f"""
  UPDATE t_orders
  SET status = {status}
  WHERE
    OID = {oid}
  """
  SQLExecuter.ExecuteQuery(SQLQuery)
  
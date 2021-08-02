"""
  The Idea behind this class to be the only link to the legacy database.
  In other word this class is an interface for communication between the 
  different Tracershop apps. 
"""
from datetime import timedelta, time

from api.lib import Formatting
from api.lib.SQL import SQLExecuter, SQLFormatter

def getCustomers():
  SQLQuery = """
    SELECT 
      Users.Username, 
      Users.Id
    FROM 
      Users
      INNER JOIN UserRoles on
        Users.Id = UserRoles.Id_User
    WHERE
      UserRoles.Id_Role = 4
  """


  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  names = ["UserName", "ID"]
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
      orders.deliver_datetime,
      orders.OID,
      orders.status,
      orders.amount,
      orders.total_amount,
      orders.run,
      Users.Username
    FROM
      orders INNER JOIN Users ON
        orders.BID = Users.Id
    WHERE
      orders.deliver_datetime LIKE \"{year}-{month}-{day}%\"
    ORDER BY
      Users.Id,
      orders.deliver_datetime
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  return [{
    "deliver_datetime" :    res[0],
    "oid" :                 res[1],
    "status" :              res[2],
    "amount" :              res[3],
    "total_amount" :        res[4],
    "run" :                 res[5],
    "realname" :            res[6]
  } for res in QueryResult]

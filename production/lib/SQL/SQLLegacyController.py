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
      EMail3,
      EMail4,
      overhead,
      kundenr,
      contact,
      tlf
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
    "email1" :   EMail1,
    "email2" :   EMail2,
    "email3" :   EMail3,
    "email4" :   EMail4,
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

  return SQLFormatter.FormatSQLTuple(SQLResult, [
      "day",
      "repeat",
      "dtime",
      "max",
      "run",
      "DTID"
    ])

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
  QueryResults = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  returnDict = {}

  #Picking the minimum
  for QueryResult in QueryResults:
    if QueryResult[0] in returnDict:
      if returnDict[QueryResult[0]] > QueryResult[1]:
        returnDict[QueryResult[0]] = QueryResult[1]
    else:
      returnDict[QueryResult[0]] = QueryResult[1]

  return returnDict

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
      order_block,
      in_use
    FROM
      Tracers
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  return SQLFormatter.FormatSQLTuple(QueryResult, [
    "id",
    "name",
    "isotope",
    "n_injections",
    "order_block",
    "in_use"
  ])
  
  

def getIsotopes():
  SQLQuery = f"""SELECT  
    id,
    name
  FROM
    isotopes
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult,[
    "ID",
    "name"
  ])


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

def updateTracer(TracerID, key, newValue):

  if key == "name":
    SQLQuery = f"""
      UPDATE Tracers
      SET
        {key} = \"{newValue}\"
      WHERE
        id = {TracerID}
    """
  else:
    SQLQuery = f"""
      UPDATE Tracers
      SET
        {key} = {newValue}
      WHERE
        id = {TracerID}
    """
  SQLExecuter.ExecuteQuery(SQLQuery)

def getTracerCustomer():
  SQLQuery = f"""
  SELECT
    tracer_id,
    customer_id
  FROM
    TracerCustomer
  ORDER BY
    tracer_id,
    customer_id
  """

  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult, [
    "tracer_id",
    "customer_id"
  ])

def createTracerCustomer(tracer_id, customer_id):
  SQLQuery = f"""
  INSERT INTO 
    TracerCustomer(tracer_id, customer_id)
  VALUES
    ({tracer_id},{customer_id})
  """
  SQLExecuter.ExecuteQuery(SQLQuery)


def deleteTracerCustomer(tracer_id, customer_id):
  SQLQuery = f"""
  DELETE FROM
    TracerCustomer
  WHERE
    tracer_id = {tracer_id} AND customer_id = {customer_id}
  """
  SQLExecuter.ExecuteQuery(SQLQuery)


def createNewTracer(name, isotope, n_injections, order_block):
  SQLQuery = f"""
  INSERT INTO
    Tracers(name, isotope, n_injections, order_block)
  VALUES
    (\"{name}\", {isotope}, {n_injections}, {order_block})
  """

  SQLExecuter.ExecuteQuery(SQLQuery)

def deleteTracer(tracer_id):
  """
    This fucntions deletes a tracer from the data base.
    This includes the tables:
      * Tracers
      * TracerCustomer
  """

  SQLQueryTracerCustomers = f"""
  DELETE FROM
    TracerCustomer
  WHERE
    tracer_id = {tracer_id}
  """
  SQLExecuter.ExecuteQuery(SQLQueryTracerCustomers)

  SQLQueryTracer  = f"""
  DELETE FROM
    Tracers
  WHERE
    id = {tracer_id}
  """
  SQLExecuter.ExecuteQuery(SQLQueryTracer)
  
def createDeliverTime( run, MaxFDG, dtime, repeat, day, customer):
  InsertQuery = f"""
    INSERT INTO
      deliverTimes(
        run,
        max,
        dtime,
        repeat_t,
        day,
        BID
      ) VALUES (
        {run},
        {MaxFDG},
        \"{dtime}\",
        {repeat},
        {day},
        {customer}
      )
  """
  SQLExecuter.ExecuteQuery(InsertQuery)
  SelectQuery = f"""
    SELECT
      max(DTID)
    FROM
      deliverTimes
    WHERE
      run   = {run}        AND
      max   = {MaxFDG}     AND
      dtime = \"{dtime}\" AND
      repeat_t = {repeat} AND
      day = {day}         AND
      BID = {customer}
  """
  ID_tuple = SQLExecuter.ExecuteQueryFetchOne(SelectQuery)

  return ID_tuple[0]

def deleteDeliverTime(DTID):
  SQLQuery = f"""
  DELETE FROM
    deliverTimes
  WHERE
    DTID = {DTID}
  """

  SQLExecuter.ExecuteQuery(SQLQuery)


def updateDeliverTime(MaxFDG, run, dtime, repeat, day, DTID):
  SQLQuery = f"""
    UPDATE deliverTimes
    SET
      day = {day},
      repeat_t = {repeat},
      dtime = \"{dtime}\",
      max = {MaxFDG},
      run = {run}
    WHERE
      DTID = {DTID}
  """

  SQLExecuter.ExecuteQuery(SQLQuery)
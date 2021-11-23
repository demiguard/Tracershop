"""
  The Idea behind this class to be the only link to the legacy database.
  In other word this class is an interface for communication between the 
  different Tracershop apps. 

  For the most part all functions work like this:

  1. Define an SQL query
  2. Execute the Query using the SQLExecuter
  3. Format the Query using the SQLFormatter
  4. Return the output

  The format that most queries comes out in a list of dict with keywords matching the keywords of the table.
"""
from datetime import timedelta, time, date

from lib import Formatting, utils
from lib.SQL import SQLExecuter, SQLFormatter

from typing import List, Dict


def getCustomers():
  SQLQuery = """
    SELECT 
      Users.Username, 
      Users.Id,
      Users.overhead,
      Users.kundenr,
      Users.realname
    FROM 
      Users
      INNER JOIN UserRoles on
        Users.Id = UserRoles.Id_User
    WHERE
      UserRoles.Id_Role = 4 AND
      Users.kundenr IS NOT NULL
  """
  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  names = ["UserName", "ID", "overhead", "CustomerNumber", "Name"]
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
      tlf,
      Username,
      Realname,
      addr1,
      addr2,
      addr3,
      addr4
    FROM
      Users
    Where
      Id={ID}
  """
  EMail1, EMail2, EMail3, EMail4, overhead, kundenr, contact, tlf, Username, Realname, addr1, addr2, addr3, addr4  = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  
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
    "tlf": tlf,
    "Username" : Username,
    "Realname" : Realname,
    "addr1"    : addr1,
    "addr2"    : addr2,
    "addr3"    : addr3,
    "addr4"    : addr4
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
      in_use,
      tracer_type
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
    "in_use",
    "tracer_type"
  ])
  
  

def getIsotopes():
  SQLQuery = f"""SELECT  
    id,
    name,
    halflife
  FROM
    isotopes
  """
  QueryResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryResult,[
    "ID",
    "name",
    "halflife"
  ])


def getActivityOrders(requestDate: date, tracer_id: int) -> List[Dict]:
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
      deliver_datetime LIKE \"{Formatting.dateConverter(requestDate)}%\" AND 
      tracer={tracer_id}
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

def UpdateOrder(Order : dict) -> None:
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

def getTOrders(requestDate: date) -> None:
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
      t_orders.deliver_datetime LIKE \"{Formatting.dateConverter(requestDate)}%\"
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

def getClosedDays():
  SQLQuery = f"""
    SELECT 
      ddate
    FROM
      blockDeliverDate
  """

  dates = utils.LMAP(lambda x : x[0], SQLExecuter.ExecuteQueryFetchAll(SQLQuery))

  return { date.strftime("%Y-%m-%d") : 1 for date in dates }

def deleteCloseDay(year, month, day):
  SQLQuery = f"""
    DELETE FROM
      blockDeliverDate
    WHERE
      ddate like \"{year}-{Formatting.convertIntToStrLen2(month)}-{Formatting.convertIntToStrLen2(day)}\"
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

def createCloseDay(year, month, day):
  SQLQuery = f"""
    INSERT INTO
      blockDeliverDate( ddate )
    VALUES
      (\"{year}-{Formatting.convertIntToStrLen2(month)}-{Formatting.convertIntToStrLen2(day)}\")
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

def insertEmptyFDGOrder(CustomerID, deliver_datetime, run, comment):
  SQLQuery = f"""
    INSERT INTO orders(
      BID,
      deliver_datetime,
      run,
      batchnr,
      amount,
      amount_o,
      total_amount,
      total_amount_o,
      status,
      tracer,
      COID,
      comment
    ) VALUES (
      {CustomerID}, 
      \"{deliver_datetime}\",
      {run},
      \"\",
      0,
      0,
      0,
      0,
      2,
      6,
      -1,
      \"{comment}\")
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

def getFDGOrder(
    BID="",
    run=0,
    deliver_datetime=""
  ):

  KeyWordList = []
  if BID:
    KeyWordList.append(("BID",BID, "str"))
  if run:
    KeyWordList.append(("run",run, "num"))
  if deliver_datetime:
    KeyWordList.append(("deliver_datetime", deliver_datetime, "str"))
  
  SQLQuery = """
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
  """

  def insertKeyWordStr(keyWordTuple):
    keyword, value, Type = keyWordTuple
    if Type == "str":
      return f"{keyword}=\"{value}\""
    else:
      return f"{keyword}={value}"

  KeywordLen = len(KeyWordList)

  if KeywordLen: #So there's Keywords
    SQLQuery += "WHERE\n"
  
  for i, keyWordTuple in enumerate(KeyWordList):
    if i + 1 < KeywordLen:
      SQLQuery += f"{insertKeyWordStr(keyWordTuple)} AND\n"
    else:
      SQLQuery += insertKeyWordStr(keyWordTuple)

  deliver_datetime, OID, status, amount, amount_o, total_amount, total_amount_o, run, BID, batchnr, COID = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)

  return {
    "deliver_datetime" : deliver_datetime,
    "oid" : OID,
    "status" : status,
    "amount" : amount,
    "amount_o" : amount_o,
    "total_amount" : total_amount,
    "total_amount_o" : total_amount_o,
    "run" : run,
    "BID" : BID,
    "batchnr" : batchnr,
    "COID" : COID
  }

def getVials(request_date : date) -> List[Dict]:
  SQLQuery = f"""
  SELECT 
    customer, 
    charge,
    filldate,
    TIME_FORMAT(filltime, \"%T\"),
    volume, 
    ID,
    activity
  FROM
    VAL
  WHERE
    filldate = \"{Formatting.dateConverter(request_date)}\"
  """
  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  names = [
    "customer",
    "charge",
    "filldate",
    "filltime",
    "volume", 
    "ID",
    "activity"
  ]
  return SQLFormatter.FormatSQLTuple(SQLResult, names)

def getVial(CustomerID = 0, Charge = "", FillDate ="", FillTime = "", Volume = 0.0, activity = 0.0, ID = 0):
  """
    This function gets a specific vial, note if the conditions above do not return a unique vial you get the first. It does kinda funky
  """
  ValidConditions = []
  def helper(name, entry,  entryType): 
    if entry:
      if entryType == "str":
        ValidConditions.append((name, f"\"{entry}\""))
      else:
        ValidConditions.append((name, entry))
  helper("customer", CustomerID, "num")
  helper("charge", Charge,       "str")
  helper("filldate", FillDate,   "str")
  helper("filltime", FillTime,   "str")
  helper("volume", Volume,       "num")
  helper("activity", activity,   "num")
  helper("ID", ID, "num")
  Condition = ""
  for i, (FieldName, FieldValue) in enumerate(ValidConditions):
    if i == 0:
      Condition += f"{FieldName} = {FieldValue}"
    else:
      Condition += f" AND {FieldName} = {FieldValue}"
  SQLQuery = f"""
  SELECT 
    customer, 
    charge,
    filldate,
    TIME_FORMAT(filltime, \"%T\"),
    volume, 
    ID,
    activity
  FROM
    VAL
  WHERE
    {Condition}
  """
  customer, charge, filldate, filltime, volume, ID, activity = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)

  return {
    "customer"  : customer,
    "charge"    : charge,
    "filldate"  : Formatting.dateConverter(filldate),
    "filltime"  : filltime ,
    "volume"    : float(volume),
    "ID"        : ID ,
    "activity"  : float(activity)
  }


def createVial(CustomerID : int, Charge : str, FillDate : str, FillTime : str, Volume : float, activity : float):
  SQLQuery = f"""
    INSERT INTO VAL(
      customer,
      charge,
      depotpos,
      filldate,
      filltime,
      volume,
      gros,
      tare,
      net,
      product,
      activity
    ) VALUES (
      {CustomerID},
      \"{Charge}\",
      0,
      \"{FillDate}\",
      \"{FillTime}\",
      {Volume},
      0,
      0,
      0,
      \"18F\",
      {activity}
      )
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

def updateVial(
  ID,
  CustomerID = 0,
  Charge = "",
  FillDate = "",
  FillTime = "",
  Volume = 0.0,
  activity = 0.0
):
  UpdateFields = []

  def helper(name, entry,  entryType): 
    if entry:
      if entryType == "str":
        UpdateFields.append((name, f"\"{entry}\""))
      else:
        UpdateFields.append((name, entry))
  helper("customer", CustomerID, "int")
  helper("charge", Charge, "str")
  helper("filldate", FillDate, "str")
  helper("filltime", FillTime, "str")
  helper("volume", Volume, "float")
  helper("activity", activity, "float")

  updateStr = ""
  for i, (field, value) in enumerate(UpdateFields):
    if i + 1 == len(UpdateFields): 
      updateStr +=f"{field}={value}\n"
    else:
      updateStr +=f"{field}={value},\n"

  if not updateStr:
    return

  SQLQuery=f"""
    UPDATE VAL
    SET
      {updateStr}
    WHERE
     ID={ID}
    """
  SQLExecuter.ExecuteQuery(SQLQuery)

def getVialRange(startDate : date, endDate: date):
  """
    Get all Vials in a date range
  
    Args:
      startDate : datetime.date - start date for the range
      endDate   : datetime.date - end date for the range
    returns a list of Dict with objects:
    [{
      customer  : int - customer number not id, that this vial belongs to
      charge    : str - batchnumber
      filldate  : date-str - date then vial was filled
      filltime  : time-str - time where vial was filled
      volume    : decimal(2) - Volume of radioactive Matieral
      ID        : int - id of Vial
      activity  : decimal(2) - Radioactive material in Vial
    }, ...]
  """

  SQLQuery = f"""
    SELECT
      customer, 
      charge,
      filldate,
      TIME_FORMAT(filltime, \"%T\"),
      volume, 
      ID,
      activity
    FROM
      VAL
    WHERE
      filldate BETWEEN \"{Formatting.dateConverter(startDate)}\" AND \"{Formatting.dateConverter(endDate)}\"
  """

  QueryRes =  SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(QueryRes, [
    "customer",
    "charge",
    "filldate",
    "filltime",
    "volume",
    "ID",
    "activity"
  ])

def FreeOrder(OrderID: int, Vial : Dict):
  SQLQuery = f"""
  UPDATE orders
  SET
    status=3,
    frigivet_amount={Vial["activity"]},
    frigivet_datetime=\"{Vial["filldate"]} {Vial["filltime"]}\",
    batchnr=\"{Vial["charge"]}\"
  WHERE
    oid={OrderID}
  """
  SQLExecuter.ExecuteQuery(SQLQuery)

  SQLFollowUpQuery = f"""
  UPDATE orders
  SET
    status=3
  WHERE
    COID={OrderID}
  """
  SQLInsertIntoVialMapping = f"""
    INSERT INTO VialMapping(
      Order_id,
      VAL_id
    ) Values ({OrderID},{Vial.ID})
  """
  SQLExecuter.ExecuteQuery(SQLInsertIntoVialMapping)

  SQLExecuter.ExecuteQuery(SQLFollowUpQuery)
  SQLReturnQuery = f"""
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
    oid={orderID} OR COID={OrderID}
  """
  updatedOrders = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
  return SQLFormatter.FormatSQLTuple(updatedOrders, [
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

def getLastOrder():
  pass
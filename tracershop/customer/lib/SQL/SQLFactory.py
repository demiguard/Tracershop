from typing import Type
from datetime import date,time,datetime
from customer.lib import calenderHelper
from customer.lib import Formatting

"""
The purpose of the SQLFactory is to create SQL queries,
Yeha there might some redudant naming
"""

def createSQLQueryOrderStatusByMonth(year :int, month : int , userID:int) -> str:
  month = Formatting.convertIntToStrLen2(month)
  return f""" 
  SELECT DISTINCT 
    DATE(deliver_datetime),
    status
  FROM orders
  WHERE 
    CONVERT(DATE(deliver_datetime), CHAR) LIKE '{year}-{month}-%' AND
    BID = {userID}
  """

def createSQLQueryTOrderStatusByMonth(year : int, month : int, userID : int):
  month = Formatting.convertIntToStrLen2(month)
  return f"""
  SELECT DISTINCT
    DATE(deliver_datetime),
    status
  FROM t_orders
  WHERE
    CONVERT (DATE(deliver_datetime), CHAR) Like '{year}-{month}-%' AND
    BID = {userID}
  """

def createSQLQueryOrdersByDay(date, userID : int) -> str:
  if type(date) != str:
    date = calenderHelper.convert_to_SQL_date(date)

  return f""" 
  SELECT 
    status,
    OID,
    amount,
    deliver_datetime,
    total_amount,
    batchnr,
    frigivet_amount,
    frigivet_datetime,
    comment,
    userName
  FROM orders
  WHERE DATE(deliver_datetime) = \'{date}\' AND
  BID = {userID}
  """
  
def createSQLQueryDailyRuns(date, userID : int) -> str:
  day_num = calenderHelper.get_day(date)
  return f"""
  SELECT 
    repeat_t,
    dtime, 
    max
  FROM
    deliverTimes
  WHERE
    day = {day_num} AND
    BID = {userID}
  ORDER BY
    dtime
  """

def createSQLQueryClosedDate(date) -> str: 
  if type(date) != str:
    date = calenderHelper.convert_to_SQL_date(date)

  return f"""
  SELECT 
    COUNT(*)
  FROM 
    blockDeliverDate
  WHERE
    ddate = \"{date}\"
  """




def createSQLQueryMaxCustomerNumber() -> str:
  return f"""
  SELECT 
    MAX(kundenr)
  FROM 
    Users
  """

def createSQLQueryInsertFTGOrder(
    amount         : int,
    amountOverhead : int,
    comment        : str,
    deliverTime    : Type[time],
    dato           : Type[date],
    run            : int,
    userID         : int,
    userName       : str
  ) -> str :
  dt_deliverTime = calenderHelper.combine_time_and_date(dato, deliverTime)
  return f"""
    INSERT INTO orders(
      amount,
      amount_o,
      batchnr,
      BID, 
      COID,
      comment,
      deliver_datetime,
      frigivet_datetime,
      run,
      status,
      total_amount, 
      tracer,
      userName
    ) VALUES (
      {amount},
      {amountOverhead},
      \"\",
      {userID},
      -1,
      \"{comment}\",
      \"{dt_deliverTime.strftime('%Y-%m-%d %H:%M:%S')}\",
      \"0000-01-01 00:00:00\",
      {run},
      1, 
      {amountOverhead},
      6,
      \"{userName}\"
    )
  """

def createSQLQueryMaxOrderID() -> str:
  return f"""
    SELECT
      MAX(OID)
    FROM
      orders
  """

def createSQLQueryMaxTOrderID() -> str:
  return f"""
    SELECT
      MAX(OID)
    FROM
      t_orders
  """


def createSQLQueryTOrderForms(userID : int) -> str:
  return f"""
  SELECT
    Tracers.name,
    Tracers.isotope,
    Tracers.n_injections,
    Tracers.order_block,
    Tracers.id
  FROM
    TracerCustomer 
      INNER JOIN 
    Tracers
      ON Tracers.id=TracerCustomer.tracer_id
  WHERE
    TracerCustomer.customer_id = {userID} AND
    Tracers.in_use = 1
  ORDER BY
    Tracers.name
  """

def createSQLQueryTOrders(date, userID : int) -> str:
  SQLDate = calenderHelper.convert_to_SQL_date(date)
  return f"""
  SELECT 
    t_orders.status,
    t_orders.OID,
    t_orders.deliver_datetime,
    t_orders.n_injections,
    t_orders.anvendelse,
    Tracers.name,
    t_orders.userName,
    t_orders.comment
  FROM
    t_orders
      INNER JOIN
    Tracers 
      ON
        Tracers.id=t_orders.tracer
  WHERE
    DATE(deliver_datetime)=DATE(\"{SQLDate}\") AND
    BID = {userID}
  """


def createSQLQUeryInsertTOrder(
    userID : int,
    deliver_datetime : Type[datetime],
    tracer : int,
    n_injections : int,
    anvendelse : str,
    userName : str,
    comment  : str
    ) -> str:

  return f"""
    INSERT INTO t_orders(
      BID,
      batchnr,
      comment,
      deliver_datetime,
      status,
      tracer,
      n_injections,
      anvendelse,
      userName
    ) VALUES (
      {userID},
      \"\",
      \"{comment}\",
      \"{deliver_datetime.strftime("%Y-%m-%d %H:%M:%S")}\",
      1,
      {tracer},
      {n_injections},
      \"{anvendelse}\",
      \"{userName}\"
    )
  """

def createSQLQueryActiveCustomers():
  return f"""
    SELECT DISTINCT
      Users.Username, Users.Id
    FROM 
      deliverTimes
        INNER JOIN
      Users
        ON
      deliverTimes.BID = Users.Id
    ORDER BY
      Users.Username
    """


def createSQLQueryMonthlyClosedDates(year, month):
  if month == 12:
    newMonth = "01"
    newYear  = year + 1
  else:
    newMonth = Formatting.convertIntToStrLen2(month + 1)
    newYear  = year
  month = Formatting.convertIntToStrLen2(month)

  return f"""
  SELECT
    ddate
  FROM
    blockDeliverDate
  WHERE
    ddate BETWEEN \"{year}-{month}-01\" AND \"{newYear}-{newMonth}-01\"
  """

def createSQLAvailbleFDGDays(UserID):
  return f"""
  SELECT DISTINCT
    day
  FROM
    deliverTimes
  WHERE
    BID={UserID}
  """

def createSQLUpdateFDG(OrderID, NewAmount, Overhead, NewComment):
  return f"""
    UPDATE orders
    SET
      amount = {NewAmount},
      amount_o =     {Overhead},
      total_amount = {Overhead},
      comment = \"{NewComment}\"
    WHERE  
      OID = {OrderID}
  """

def createSQLDeleteFDG(OrderID):
  #Build in check so that you can't delete status 2,3 orders
  return f"DELETE FROM orders WHERE OID={OrderID} AND status=1"

def createSQLGetOverhead(CustomerID):
  return f"""
  SELECT overhead
  FROM Users
  WHERE 
    Id={CustomerID}
  """

def createSQLDeleteTOrders(OrderID):
  #Build in check not to delete a known Order
  return f"DELETE FROM t_order WHERE OID={OrderID} AND status=1"

def createSQLGetTorderDate(OrderID):
  return f"""
  SELECT 
    status, order_time
  From 
    t_orders
  WHERE 
    OID={OrderID}
  """

def createSQLupdateTOrder(OrderID, NewInjections, orderDateTime, newComment, NewUse):
  return f"""
  Update t_orders
  SET
    n_injections = {NewInjections},
    order_time   = \"{orderDateTime.strftime("%Y-%m-%d %H:%M:%S")}\",
    comment      = \"{newComment}\"
    anvendelse   = \"{NewUse}\"
  WHERE
    OID = {OrderID} AND 
    status = 1
  """
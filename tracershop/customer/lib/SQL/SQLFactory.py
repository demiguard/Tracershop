from typing import Type
from datetime import date,time,datetime

from customer.lib import calenderHelper

"""
The purpose of the SQLFactory is to create SQL queries
"""


def createSQLQueryOrderStatusByMonth(year :int, month : int , userID:int) -> str:
  month = str(month)
  if len(month) == 1:
    month = "0" + month

  return f""" 
  SELECT DISTINCT 
    DATE(deliver_datetime),
    status
  FROM orders
  WHERE 
    CONVERT(DATE(deliver_datetime), CHAR) LIKE \'{year}-{month}-%\' AND
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
    comment
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
    ddate = {date}
  """

def createSQLQueryMaxCustomerNumber() -> str:
  return f"""
  SELECT 
    MAX(Users.kundenr),
    MAX(customer_user.customer_number)
  FROM 
    Users,
    customer_user
  """

def createSQLQueryInsertFTGOrder(
    amount      : int,
    deliverTime : Type[time],
    dato        : Type[date],
    comment     : str,
    userID      : int
  ) -> str :
  dt_deliverTime = calenderHelper.combine_time_and_date(dato, deliverTime)
  return f"""
    INSERT INTO orders(
      BID, 
      amount,
      deliver_datetime,
      status,
      batchnr,
      tracer,
      frigivet_datetime,
      comment
    ) VALUES (
      {userID},
      {amount},
      \"{dt_deliverTime.strftime('%Y-%m-%d %H:%M:%S')}\",
      1,
      \"\",
      6,
      \"0000-01-01 00:00:00\",
      \"{comment}\"
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
    Tracers.name
  FROM
    t_orders
      INNER JOIN
    Tracers 
      ON
        Tracers.id=t_orders.tracer
  WHERE
    BID = {userID} AND
    DATE(deliver_datetime) = \"{SQLDate}\"
  """
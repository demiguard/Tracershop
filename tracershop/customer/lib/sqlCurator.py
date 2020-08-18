from django.db import connection

from customer.lib import calenderHelper


def check_for_injection(query):
  pass



def query_order_by_month(year,month, userID):
  month = str(month)
  if len(month) == 1:
    month = "0" + month


  SQLQuery = f""" 
  SELECT DISTINCT 
    DATE(order_time),
    status
  FROM orders
  WHERE 
    CONVERT(DATE(order_time), CHAR) LIKE \'{year}-{month}-%\' AND
    BID = {userID}
  """
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    orders = list(cursor.fetchall())

  return orders

def query_order_by_date(date, userID):
  """
    Queries for orders 
  
  
  """

  #Perform query

  #Move this to a helper function
  if type(date) != str:
    date = calenderHelper.convert_to_sql_date(date)

  SQLQuery = f""" 
  SELECT 
    status,
    OID,
    amount,
    deliver_datetime,
    total_amount,
    batchnr,
    frigivet_amount,
    frigivet_datetime
  FROM orders
  WHERE DATE(order_time) = \'{date}\' AND
  BID = {userID}
  """
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    orders = list(cursor.fetchall())

  return orders

def get_daily_runs(date, userID):
  day_num = calenderHelper.get_day(date)

  SQLQuery = f"""
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

  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    runs = list(cursor.fetchall())

  return runs

def get_closed(date):
  """
    Determines if production have closed on a specific day

    Args:
      date: string on format YYYY-MM-DD, datetime.date or datetime.datetime obejcts 


  """
  if type(date) != str:
    date = calenderHelper.convert_to_sql_date(date)

  SQLQuery = f"""
  SELECT 
    COUNT(*)
  FROM 
    blockDeliverDate
  WHERE
    ddate = {date}
  """
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    openOrclosed = cursor.fetchone()
  if openOrclosed == 1:
    return True
  return False











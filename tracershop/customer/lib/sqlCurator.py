from django.db import connection

from customer.lib import calenderHelper
from customer.models import PotentialUser

def check_for_injection(query):
  pass



def query_order_by_month(year,month, userID) -> list:
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

def query_order_by_date(date, userID) -> list:
  """
    Queries for orders for a specific date
  
  
  """
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
  #Perform query
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    orders = list(cursor.fetchall())

  return orders

def get_daily_runs(date, userID) -> list:
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

def get_closed(date) -> bool:
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

def get_unverified_users() -> list: 
  return list(PotentialUser.objects.all())


def getMaxCustomerNumber() -> int:
  SQLQuery = f"""
  SELECT 
    MAX(Users.kundenr),
    MAX(customer_user.customer_number)
  FROM 
    Users,
    customer_user
  """
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    MaxCustomerNumber = max(cursor.fetchone())
  return MaxCustomerNumber
  










"""
  This file contains all the SQL-queries executed by the SQL controller
  This is an extention file to the SQLController
"""
__author__ = "Christoffer Vilstrup Jensen"

from typing import Type
from datetime import date,time,datetime
from dataclasses import fields

from lib.SQL.SQLFormatter import SerilizeToSQLValue
from lib.ProductionDataClasses import ActivityOrderDataClass
from lib.Formatting import dateConverter

def getCustomers() -> str:
  return """
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

def getCustomer(ID: int) -> str:
  return f"""
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

def getCustomerDeliverTimes(ID : int) -> str:
  return f"""
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

def getTracers() -> str:
  return f"""
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

def getIsotopes() ->  str:
  return f"""
    SELECT  
      id,
      name,
      halflife
    FROM
      isotopes
  """

def getActivityOrders(requestDate: date, tracerID: int) -> str:
  return f"""
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
      deliver_datetime LIKE \"{dateConverter(requestDate)}%\" AND 
      tracer={tracerID}
    ORDER BY
      BID,
      deliver_datetime
  """

def getRuns() -> str: 
  return """
    SELECT 
      day,
      TIME_FORMAT(ptime, \"%T\"), 
      run
    FROM 
      productionTimes
    ORDER BY
      day, ptime
  """

def getDeliverTimes() -> str:
  return """
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

def updateOrder(Order : ActivityOrderDataClass) -> str:
  SQLQuery = """
    Update orders
    Set
  """
  Fields = fields(Order)
  for field in Fields:
    fieldVal =  Order.__getattribute__(field.name)
    if field.name == "oid" or not fieldVal:
      continue
    SQLQuery += f"{field.name}={SerilizeToSQLValue(fieldVal)},\n"
  SQLQuery = SQLQuery[:-2] + SQLQuery[-1] # Remove the last ','
  SQLQuery += f"""
    WHERE
      oid = {Order.oid}
  """
  return SQLQuery
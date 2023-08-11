import json

import re

from constants import DATETIME_REGULAR_EXPRESSION, DATETIME_REGULAR_EXPRESSION_JS, SQL_TABLE_REGULAR_EXPRESSION, TIME_FORMAT, DATE_FORMAT, DATETIME_FORMAT
from datetime import date, time, datetime

from database import models

def FormatDateTimeJStoSQL(datetimestr : str) -> str:
  if re.match(DATETIME_REGULAR_EXPRESSION_JS, datetimestr):
    return datetimestr.replace("T", " ")
  if re.match(DATETIME_REGULAR_EXPRESSION, datetimestr):
    return datetimestr
  else: #
    raise ValueError("Input is not datetime format")

def dateConverter(Date : date, Format: str=DATE_FORMAT) -> str:
  """
    Extracts date on the string format for the database
    Args:
      Date - datetime.date object
    KwArgs:
      Format - Default Constant DATE_FORMAT - The Format of the date object,
               With this format one should be able to send this to the
               database
    Returns:
      string - ready for the database
  """
  return Date.strftime(Format)

def timeConverter(Time : time, Format: str=TIME_FORMAT) -> str:
  return Time.strftime(Format)

def datetimeConverter(DateTime : datetime, Format: str=DATETIME_FORMAT ) -> str:
  return DateTime.strftime(Format)

def toTime(TimeStr : str, Format: str=TIME_FORMAT) -> time:
  # Since time doesn't have a strptime, you have to take advantage of datetimes
  DummyTime = toDateTime("1993-11-20 "+ TimeStr, Format="%Y-%m-%d " + Format)
  return DummyTime.time()

def toDateTime(DateTimeStr : str , Format: str=DATETIME_FORMAT) -> datetime:
  return datetime.strptime(DateTimeStr, Format)

def toDate(DateStr : str, Format: str=DATE_FORMAT) -> date:
  # Since date doesn't have a strptime, you have to take advantage of datetimes
  DummyTime = datetime.strptime(DateStr, Format)
  return DummyTime.date()

def mergeDateAndTime(Date : date, Time: time) -> datetime:
  return datetime(Date.year, Date.month, Date.day, Time.hour, Time.minute, Time.second)

def ParseSQLField(SQL_Field : str) -> str:
  """Extracts the Field name from a composite field

  Args:
      SQL_Field (str): The string on the format <table>.<name>

  Returns:
      str: <name>
  """
  # Some dataclasses are compositions of multiple tables.
  # So their field name is <table>.<name>, which is not a valid python attribute value
  # This Functions extract the correct name

  if not re.match(SQL_TABLE_REGULAR_EXPRESSION, SQL_Field):
    raise ValueError("Input is not on correct format")

  if '.' in SQL_Field:
    _ , ID = SQL_Field.split(".")
  else:
    ID = SQL_Field
  return ID

def mapTracerUsage(tracerUsage: models.TracerUsage):
  if tracerUsage == models.TracerUsage.human:
    return "humant"
  if tracerUsage == models.TracerUsage.animal:
    return "dyr"
  if tracerUsage == models.TracerUsage.other:
    return "Andet"
import json

from constants import TIME_FORMAT, DATE_FORMAT, DATETIME_FORMAT
from datetime import date, time, datetime

def ParseJSONRequest(request):
  if request.body:
    return json.load(request)
  else:
    return {}

def convertIntToStrLen2(INT : int) -> str:
  INT = str(INT)
  if len(INT) == 1:
    return "0" + INT
  return INT

def FormatDateTimeJStoSQL(datetimestr : str) -> str:
  return datetimestr.replace("T", " ")

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
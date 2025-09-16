"""This module converts objects to their desired string form"""

# Python standard modules
from datetime import date, time, datetime, timezone
from pprint import pprint
from io import BytesIO
import re
from typing import Any, Dict, List, Optional

# Third Party modules
from django.db.utils import IntegrityError
from pandas import DataFrame, ExcelWriter

# Tracershop Packages
from constants import DATETIME_REGULAR_EXPRESSION,\
  TIME_FORMAT, DATE_FORMAT, TIME_REGULAR_EXPRESSION,\
  DATETIME_RE_UTC, DATETIME_RE_WITH_MICRO

from database import models

def dateConverter(date_: date, format_: str=DATE_FORMAT) -> str:
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
  return date_.strftime(format_)

def timeConverter(time_ : time, format_: str=TIME_FORMAT) -> str:
  return time_.strftime(format_)

def toTime(time_str : str) -> time:
  m = TIME_REGULAR_EXPRESSION.search(time_str)
  if m is None:
    raise ValueError(f"Could not convert {time_str}")

  hour, minute, second = (int(value) for value in m.groups())
  return time(hour, minute, second)


def toDateTime(
    date_time_str: str,
    timezone_=timezone.utc
  ) -> datetime:
  """Produces a datetime from a string. Using the regex such that

  Args:
      date_time_str (str): _description_
  Kwargs:


  Raises:
      ValueError: _description_

  Returns:
      datetime: _description_
  """

  m = DATETIME_REGULAR_EXPRESSION.search(date_time_str)

  if m is None:
    raise ValueError(f"Could not convert {date_time_str} to a datetime object")

  year, month, day, hour, minute, second = (int(value) for value in m.groups())
  # Javascript automatically converts to utc
  return datetime(year, month, day, hour, minute, second, tzinfo=timezone_)


def toDate(date_str: str, Format: str=DATE_FORMAT) -> date:
  # Since date doesn't have a strptime, you have to take advantage of datetimes
  DummyTime = datetime.strptime(date_str, Format)
  return DummyTime.date()


def formatFrontendErrorMessage(message: Dict) -> str:
  raw_error_message = message.get("message", "Unknown error")
  raw_stack = message.get('stack', "")
  tracershop_code_regex = re.compile(r"src/components/(.+)\?:(\d+):(\d+)")

  def helper(string: str):
    res = re.findall(tracershop_code_regex, string)
    fileName, lineNumber, index = res[0]
    return f"{fileName} at: {lineNumber}"

  if raw_stack is None:
    return "There's no Stack information!"
  raw_split_stack = raw_stack.split('\n')
  split_stack = [helper(x) for x in filter(lambda string:
    tracershop_code_regex.search(string) is not None, raw_split_stack)]

  return f"\"{raw_error_message}\" raised at: " + "\n".join(split_stack).strip()

def toDanishDecimalString(number, decimals = 2):
  if decimals == 0:
    return str(int(number))
  return str(round(number, decimals)).replace('.', ',')

def empty_none_formatter(optional_string: Optional[str]):
  if optional_string is None:
    return ""
  return optional_string

def format_csv_data(csv_data: Dict[str, Dict[str, List[Any]]]):
  excel_bytes = BytesIO()

  with ExcelWriter(excel_bytes) as writer:
    for sheet_name, data_frame_raw in csv_data.items():
      data_frame = DataFrame(data_frame_raw)
      data_frame.to_excel(writer, sheet_name=sheet_name)

  excel_bytes.seek(0)
  return excel_bytes

def format_time_number(num: int) -> str:
  # Python ternaries are ugly as fuck
  return f"0{num}" if num < 10 else str(num)

def camelcase_to_readable(text: str) -> str:
  result = ""
  for char in text:
    result += f" {char}" if char.isupper() else char
  return result.strip()

def format_message_name(message_name: str):
  name_splits = message_name.split('_')
  return '_'.join(name_splits[1:])

def format_error_with_datatype(error: Exception, datatype: str):
  if datatype in models.MODELS:
    model = models.MODELS[datatype]
    if isinstance(error, IntegrityError):
      code, _message = error.args

      if code == 1062:
        return f"Der findes allerede en tilsvarende {model.display_name}, benyt den i stedet."
  else:
    return "Invalid Message, datatype is not a known model?!"




  return str(error)
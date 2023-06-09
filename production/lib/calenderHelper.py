# Python standard library
from datetime import datetime, date, timedelta, time

# Thrid party library

# Tracershop packages

def subtract_times(time_1: time, time_2: time) -> timedelta:
  """The equvivalent of time_1 - time_2
  """
  datetime_1 = datetime(1970, 1, 1, time_1.hour, time_1.minute, time_1.second)
  datetime_2 = datetime(1970, 1, 1, time_2.hour, time_2.minute, time_2.second)

  return datetime_1 - datetime_2

def combine_date_time(d: date, t: time) -> datetime:
  return datetime(d.year, d.month, d.day, t.hour, t.minute, t.second)

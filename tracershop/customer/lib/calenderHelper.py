import datetime
import calendar

import customer.lib.SQL.SQLController as SQL

def get_hour_from_dt(dt):
  if dt:
    return dt.strftime("%H:%M")
  else:
    return None


def convert_to_datetime_time(user_input):
  if type(user_input) == datetime.time:
    return user_input
  if type(user_input) == datetime.datetime:
    return datetime.time(user_input.hour, user_input.minute)
  raise TypeError(f"Called with unknown type: {type(user_input)}")


def get_day(date):
  """
    Accepts Datetime or Date obejcts. 
    Note that this uses our custom date format 
      Monday: 1
      Thursday: 2
      ...
  """
  return calendar.weekday(date.year, date.month, date.day) + 1


def convert_to_SQL_date(date):  
  return date.strftime('%Y-%m-%d')

def pad_0_to_num(num:int) -> str:
  if num < 10:
    return "0" + str(num)
  else:
    return str(num)


def compare_hours(date_one, date_two): 
  date_one = convert_to_datetime_time(date_one)
  date_two = convert_to_datetime_time(date_two)
  return date_one == date_two

def combine_time_and_date(date, time):
  return datetime.datetime(date.year, date.month, date.day, time.hour, time.minute)


def timedeltaToTime(timedelta):
  return (datetime.datetime.min + timedelta).time()

def getNextWeekday(today):
  NextDateCandidate = today + datetime.timedelta(days=1)
  while NextDateCandidate.weekday() not in [0,1,2,3,4]:
    NextDateCandidate += datetime.timedelta(days=1)
  return NextDateCandidate

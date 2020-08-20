import datetime
import calendar

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


def convert_to_sql_date(date):
  year = str(date.year)
  if date.month < 10:
    month = "0" + str(date.month)
  else:
    month = str(date.month)
  if date.day < 10:
    day = "0" + str(date.day)
  else:
    day = str(date.day)
  return f"{year}-{month}-{day}"


def compare_hours(date_one, date_two): 
  date_one = convert_to_datetime_time(date_one)
  date_two = convert_to_datetime_time(date_two)
  return date_one == date_two
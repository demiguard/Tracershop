""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import date, time, datetime, timedelta
from datetime import timezone as pTimeZone
from logging import Logger
import re
from typing import Callable, Dict, List, Optional, Tuple


# Third party libraries
from django.utils import timezone
from pandas import DataFrame

# Tracershop packages
from constants import DATETIME_RE_UTC, DATETIME_REGULAR_EXPRESSION,\
  DATETIME_RE_WITH_MICRO, DATETIME_RE_WITH_MICRO_TZ_PLUS,\
  DATETIME_RE_WITH_MICRO_TZ_MINUS
from core.exceptions import InvalidCSVFile, UnknownUnit
from database import models # import Customer, Tracer, Vial, UserGroups

vial_tracer_tag_regex = re.compile(r"(\w+)\-\d{6}\-\d+")

def update_tracer_mapping():
  tracer_mapping = {}
  for tracer in models.Tracer.objects.all():
    if tracer.vial_tag is not None and tracer.vial_tag != "":
      tracer_mapping[tracer.vial_tag] = tracer
  return tracer_mapping

def update_customer_mapping():
  customer_mapping = {}
  for customer in models.Customer.objects.all():
    if customer.dispenser_id is not None:
      customer_mapping[customer.dispenser_id] = customer
  return customer_mapping


def _parse_customer(string: str, vial: 'models.Vial', logger: Logger):
  regex = re.compile(r"customer:\s*(\d+)\s*\-\w+\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    dispenser_id_str, = regex_match.groups()
    dispenser_id = int(dispenser_id_str)
    customer_mapping = update_customer_mapping()
    if dispenser_id in customer_mapping:
      vial.owner = customer_mapping[dispenser_id]
  else:
    logger.debug(f"Regex doesn't match sting: {string}")
  logger.debug(f"Parsed String: \"{string}\" and mapped it to customer {vial.owner}")

def _parse_charge(string: str, vial: 'models.Vial', logger: Logger):
  # I could regex this correctly, but...
  regex = re.compile(r"charge:\s*([\w\-]+)\s*")
  regex_match = regex.match(string)
  if regex_match is None:
    logger.error("Charge is empty! invalid file!")
    return
  lot_number, = regex_match.groups()
  vial.lot_number = lot_number
  vial_tag_match = vial_tracer_tag_regex.match(lot_number)
  if vial_tag_match is None:
    logger.error("Lot number is not on lot number format!")
    return

  tracer_mapping = update_tracer_mapping()
  vial_tag, = vial_tag_match.groups()
  if vial_tag in tracer_mapping:
    vial.tracer = tracer_mapping[vial_tag]


def _parse_fill_date(string: str, vial: 'models.Vial', logger: Logger):
  regex = re.compile(r"filldate:\s*(\d{2}).(\d{2}).(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    day_str, month_str, year_str = regex_match.groups()
    vial.fill_date = date(2000 + int(year_str), int(month_str), int(day_str))


def _parse_fill_time(string: str, vial: 'models.Vial', logger: Logger):
  regex = re.compile(r"filltime:\s*(\d{2}):(\d{2}):(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    hour_str, min_str, sec_str = regex_match.groups()
    vial.fill_time = time(int(hour_str), int(min_str), int(sec_str))

def _parse_activity(string: str, vial: 'models.Vial', logger: Logger):
  regex = re.compile(r"activity:\s*(\d+(\.\d+)?)\s*MBq;\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    activity_str = regex_match.groups()
    vial.activity = float(activity_str[0])


def _parse_volume(string: str, vial: 'models.Vial', logger: Logger):
  regex = re.compile(r"volume:\s*(\d+(\.\d+)?)\s*ml\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    volume_str = regex_match.groups()
    vial.volume = float(volume_str[0])


parserFunctions = {
  'customer' : _parse_customer,
  'charge' : _parse_charge,
  'filldate': _parse_fill_date,
  'filltime': _parse_fill_time,
  'activity': _parse_activity,
  'volume': _parse_volume,
}

def parse_val_file(file_content: List[str], logger: Logger) -> 'models.Vial':
  vial = models.Vial()
  keyword_regex = re.compile(r"(\w+):")
  for val_string in file_content:
    logger.debug(f"Parsing {val_string.strip()}")
    match = keyword_regex.match(val_string)
    if match is None:
      logger.error(f"Could not Parse line: {val_string}")
      continue

    key, = match.groups()
    if key not in parserFunctions:
      continue

    # These function
    parserFunctions[key](val_string, vial, logger)

  return vial


def parse_data_frame_row_to_vial(data_frame: DataFrame) -> List['models.Vial']:
  vials: List['models.Vial'] = []
  valid_data_frame = 'BatchReference' in data_frame\
                 and 'Customer' in data_frame\
                 and 'DateTimeStamp' in data_frame\
                 and 'DispensedDose' in data_frame\
                 and 'RadVolumeDispensed' in data_frame\
                 and 'ValueUnits' in data_frame
  if not valid_data_frame:
    raise InvalidCSVFile()

  for i, data_row in data_frame.iterrows():
    # Raises Value Error
    vial_tap_timestamp_string = str(data_row['DateTimeStamp'])

    vial_tap_timestamp = datetime.strptime(vial_tap_timestamp_string.strip(), '%d-%m-%Y %H:%M:%S')

    units = str(data_row['ValueUnits']).lower().strip()

    if units == 'mbq':
      factor = 1
    elif units == 'gbq':
      factor = 1000
    elif units == 'kbq':
      factor = 0.001
    else:
      raise UnknownUnit(f"Unknown Bq unit:{data_row['ValueUnits']}, units: {units}")

    batch_number = str(data_row['BatchReference'])

    tracer_tag_match = vial_tracer_tag_regex.search(batch_number)

    if tracer_tag_match is None:
      raise Exception

    tracer_key, = tracer_tag_match.groups()

    tracer = models.Tracer.objects.get(vial_tag=tracer_key)

    activity = factor * data_row['DispensedDose']
    volume = data_row['RadVolumeDispensed'] # Assumed to ml

    customer = models.Customer.objects.get(short_name__iexact=data_row['Customer'])

    vial = models.Vial(
      tracer=tracer,
      activity=activity,
      volume=volume,
      lot_number=data_frame['BatchReference'],
      fill_time=vial_tap_timestamp.time(),
      fill_date=vial_tap_timestamp.date(),
      owner=customer
    )

    vials.append(vial)

  return vials



def parse_index_header(header: Dict[str,str]) -> Tuple['models.UserGroups', str]:
  if 'X-Tracer-Role' in header:
    try:
      user_group = models.UserGroups(int(header['X-Tracer-Role']))
    except ValueError:
      user_group = models.UserGroups.ShopExternal
  else:
    user_group = models.UserGroups.Anon

  if 'X-Tracer-User' in header:
    username = header['X-Tracer-User']
  else:
    username = ""

  return user_group, username

def extract_deleted_accessionNumber(OBR_MESSAGE_SEGMENT):
  return OBR_MESSAGE_SEGMENT[20][0]


def _ParseUTC(datetime_string:str) -> Optional[datetime]:
  m = DATETIME_RE_UTC.match(datetime_string)

  if m is None:
    return None

  return datetime(*(int(value) for value in m.groups()), tzinfo=pTimeZone.utc)

def _ParseDatetimePlain(datetime_string: str):
  m = DATETIME_REGULAR_EXPRESSION.match(datetime_string)

  if m is None:
    return None

  return datetime(*(int(value) for value in m.groups()), tzinfo=timezone.get_current_timezone())

def _Parse_datetime_with_micro(datetime_string:str):
  m = DATETIME_RE_WITH_MICRO.match(datetime_string)

  if m is None:
    return None

  return datetime(*(int(value) for value in m.groups()), tzinfo=timezone.get_current_timezone())

def _parse_datetime_with_micro_plus_tz(datetime_string:str):
  m = DATETIME_RE_WITH_MICRO_TZ_PLUS.match(datetime_string)

  if m is None:
    return None

  year, month, day, hour, minute, second, micro_sec, hourly_utc_offset, minute_offset = (int(value) for value in m.groups())

  return datetime(
    year,
    month,
    day,
    hour,
    minute,
    second,
    micro_sec,
    tzinfo=pTimeZone(timedelta(hours=hourly_utc_offset, minutes=minute_offset)))

def _parse_datetime_with_micro_minus_tz(datetime_string:str):
  m = DATETIME_RE_WITH_MICRO_TZ_MINUS.match(datetime_string)

  if m is None:
    return None

  year, month, day, hour, minute, second, micro_sec, hourly_utc_offset, minute_offset = (int(value) for value in m.groups())

  return datetime(
    year,
    month,
    day,
    hour,
    minute,
    second,
    micro_sec,
    tzinfo=pTimeZone(timedelta(hours=-hourly_utc_offset, minutes=-minute_offset)))



def toDatetime(datetime_string:str) -> datetime:
  parsing_functions: List[Callable[[str], Optional[datetime]]] = [
    _ParseUTC,
    _ParseDatetimePlain,
    _Parse_datetime_with_micro,
    _parse_datetime_with_micro_plus_tz,
    _parse_datetime_with_micro_minus_tz

  ]

  res = None
  for func in parsing_functions:
    res = func(datetime_string)
    if res is not None:
      return res

  raise ValueError(f"Could not parse {datetime_string}")

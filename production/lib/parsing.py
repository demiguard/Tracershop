""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import date, time
from logging import Logger
import re
from typing import Dict, List, Tuple

# Third party libraries

# Tracershop packages
from database.models import Customer, Tracer, Vial, UserGroups

tracer_mapping = {}
customer_mapping = {}
def update_tracer_mapping():
  for tracer in Tracer.objects.all():
    if tracer.vial_tag is not None and tracer.vial_tag != "":
      tracer_mapping[tracer.vial_tag] = tracer
update_tracer_mapping()

def update_customer_mapping():
  for customer in Customer.objects.all():
    if customer.dispenser_id is not None:
      customer_mapping[customer.dispenser_id] = customer
update_customer_mapping()

def _parse_customer(string: str, vial: Vial, logger: Logger):
  regex = re.compile("customer:\s*(\d+)\-\w+\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    dispenser_id_str, = regex_match.groups()
    dispenser_id = int(dispenser_id_str)
    if dispenser_id in customer_mapping:
      vial.owner = customer_mapping[dispenser_id]
  else:
    logger.debug(f"Regex doesn't match sting: {string}")
  logger.debug(f"Parsed String: \"{string}\" and mapped it to customer {vial.owner}")

def _parse_charge(string: str, vial: Vial, logger: Logger):
  # I could regex this correctly, but...
  regex = re.compile("charge:\s*([\w\-]+)\s*")
  regex_match = regex.match(string)
  if regex_match is None:
    return
  lot_number, = regex_match.groups()
  vial.lot_number = lot_number
  vial_tag_regex = re.compile("(\w+)\-\d{6}\-\d+")
  vial_tag_match = vial_tag_regex.match(lot_number)
  if vial_tag_match is None:

    return

  vial_tag, = vial_tag_match.groups()
  if vial_tag in tracer_mapping:
    vial.tracer = tracer_mapping[vial_tag]


def _parse_fill_date(string: str, vial: Vial, logger: Logger):
  regex = re.compile("filldate:\s*(\d{2}).(\d{2}).(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    day_str, month_str, year_str = regex_match.groups()
    vial.fill_date = date(2000 + int(year_str), int(month_str), int(day_str))


def _parse_fill_time(string: str, vial: Vial, logger: Logger):
  regex = re.compile("filltime:\s*(\d{2}):(\d{2}):(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    hour_str, min_str, sec_str = regex_match.groups()
    vial.fill_time = time(int(hour_str), int(min_str), int(sec_str))

def _parse_activity(string: str, vial: Vial, logger: Logger):
  regex = re.compile("activity:\s*(\d+(\.\d+)?)\s*MBq;\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    activity_str = regex_match.groups()
    vial.activity = float(activity_str[0])


def _parse_volume(string: str, vial: Vial, logger: Logger):
  regex = re.compile("volume:\s*(\d+(\.\d+)?)\s*ml\s*")
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

def parse_val_file(file_content: List[str], logger : Logger) -> Vial:
  vial = Vial()
  keyword_regex = re.compile("(\w+):")
  for val_string in file_content:
    logger.debug(f"Parsing {val_string}")
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

def parse_index_header(header: Dict[str,str]) -> Tuple[UserGroups, str]:
  if 'X-Tracer-Role' in header:
    try:
      user_group = UserGroups(int(header['X-Tracer-Role']))
    except ValueError:
      user_group = UserGroups.ShopExternal
  else:
    user_group = UserGroups.Anon

  if 'X-Tracer-User' in header:
    username = header['X-Tracer-User']
  else:
    username = ""

  return user_group, username

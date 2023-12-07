if __name__ != '__main__':
  exit(1)

import os
import django
import logging

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

import re

from datetime import date, time
from typing import List
from time import sleep
from pathlib import Path
from constants import VIAL_LOGGER, VIAL_WATCHER_FILE_PATH_ENV
from database.models import Vial, Tracer, Customer
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent
from watchdog.observers.polling import PollingObserver as Observer

VIAL_WATCHER_FILE_PATH = os.environ[VIAL_WATCHER_FILE_PATH_ENV]
logger = logging.getLogger(VIAL_LOGGER)

tracer_mapping = {}
customer_mapping = {}
def _create_tracer_mapping():
  for tracer in Tracer.objects.all():
    if tracer.vial_tag is not None and tracer.vial_tag != "":
      tracer_mapping[tracer.vial_tag] = tracer
_create_tracer_mapping()


def _create_customer_mapping():
  for customer in Customer.objects.all():
    if customer.dispenser_id is not None:
      customer_mapping[customer.dispenser_id] = customer
_create_customer_mapping()


def _parse_customer(string: str, vial: Vial):
  regex = re.compile("customer:\s*(\d+)\w+\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    dispenser_id_str, = regex_match.groups()
    dispenser_id = int(dispenser_id_str)
    if dispenser_id in customer_mapping:
      vial.owner = customer_mapping[dispenser_id]

def _parse_charge(string: str, vial: Vial):
  regex = re.compile("charge:\s*(\w+)\s*")
  regex_match = regex.match(string)
  if regex_match is None:
    return
  lot_number, = regex_match.groups()
  vial.lot_number = lot_number
  vial_tag_regex = re.compile("(\w+)-\d{6}-\d+")
  vial_tag_match = vial_tag_regex.match(lot_number)
  if vial_tag_match is None:
    return

  vial_tag, = vial_tag_match.groups()
  if vial_tag in tracer_mapping:
    vial.tracer = tracer_mapping[vial_tag]


def _parse_fill_date(string: str, vial: Vial):
  regex = re.compile("filldate:\s*(\d{2}).(\d{2}).(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    day_str, month_str, year_str = regex_match.groups()
    vial.fill_date = date(int(day_str), int(month_str), 2000 + int(year_str))


def _parse_fill_time(string: str, vial: Vial):
  regex = re.compile("filltime:\s*(\d{2}):(\d{2}):(\d{2})\s*")
  regex_match = regex.match(string)
  if regex_match is not None:
    hour_str, min_str, sec_str = regex_match.groups()
    vial.fill_time = time(int(hour_str), int(min_str), int(sec_str))

def _parse_activity(string: str, vial: Vial):
  regex = re.compile("activity:\s*(\d+(?\.\d+)?)\s*MBq;")
  regex_match = regex.match(string)
  if regex_match is not None:
    activity_str, = regex_match.groups()
    vial.activity = float(activity_str)


def _parse_volume(string: str, vial: Vial):
  regex = re.compile("volume:\s*(\d+(?\.\d+)?)\s*ml")
  regex_match = regex.match(string)
  if regex_match is not None:
    volume_str, = regex_match.groups()
    vial.volume = float(volume_str)


parserFunctions = {
  'customer' : _parse_customer,
  'charge' : _parse_charge,
  'filldate': _parse_fill_date,
  'filltime': _parse_fill_time,
  'activity': _parse_activity,
  'volume': _parse_volume,
}


def parse_val_file(file_content: List[str]) -> Vial:
  vial = Vial()
  keyword_regex = re.compile("(\w+):")
  for val_string in file_content:
    match = keyword_regex.match(val_string)
    if match is None:
      logger.error(f"Could not Parse line: {val_string}")
      continue

    key, = match.groups()
    if key not in parserFunctions:
      continue

    # These function
    parserFunctions[key](val_string, vial)

  return vial


class VialFileHandler(FileSystemEventHandler):
  def on_any_event(self, event: FileSystemEvent):
    logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")

  def on_created(self, event: FileCreatedEvent):
    val_path = Path(event.src_path)

    with val_path.open("r") as fp:
      data = fp.readlines()

    try:
      vial = parse_val_file(data)
      if vial is not None:
        vial.save()
        val_path.unlink()
    except:
      logger.error(f"Failed to process file {event.src_path}")

  def on_modified(self, event: FileCreatedEvent):
    if event.is_directory:
      return

    val_path = Path(event.src_path)

    with val_path.open("r") as fp:
      data = fp.readlines()

    try:
      vial = parse_val_file(data)
      if vial is not None:
        vial.save()
        val_path.unlink()
    except:
      logger.error(f"Failed to process file {event.src_path}")


observer = Observer()
observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, True)
observer.start()

vial_file_path = Path(VIAL_WATCHER_FILE_PATH)

# Process files that might have been there earlier

for val_path in vial_file_path.glob('VAL*'):
  logger.info(f"Processing file {val_path}")

  with val_path.open("r") as fp:
    data = fp.readlines()

  try:
    vial = parse_val_file(data)
    if vial is not None:
      vial.save()
      val_path.unlink()
  except:
    logger.error(f"Failed to process file {val_path}")


try:
  while True:
    sleep(600)
    _create_tracer_mapping()
    _create_customer_mapping()
finally:
  observer.stop()
  observer.join()

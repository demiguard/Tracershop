if __name__ == '__main__':
  exit(1)

import os
import django
import logging


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

import re

from typing import List
from time import sleep
from pathlib import Path
from constants import VIAL_LOGGER, VIAL_WATCHER_FILE_PATH_ENV
from database.models import Vial, Tracer
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent
from watchdog.observers.polling import PollingObserver as Observer

VIAL_WATCHER_FILE_PATH = os.environ(VIAL_WATCHER_FILE_PATH_ENV)
logger = logging.getLogger(VIAL_LOGGER)

tracer_mapping = {}

def create_tracer_mapping():
  for tracer in Tracer.objects.all():
    if tracer.vial_tag is not None or tracer.vial_tag != "":
      tracer_mapping[tracer.vial_tag] = tracer

def parse_customer(string, vial):
  pass


parserFunctions = {
  'customer' : parse_customer,
  'charge' : lambda x, y : None,
  'filldate': lambda x, y : None,
  'filltime': lambda x, y : None,
  'activity': lambda x, y : None,
  'volume': lambda x, y : None,
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
      logger.error(f"")
      continue

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
      logger.error("Failed to do stuff!")


observer = Observer()
observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, True)
observer.start()

try:
  while True:
    sleep(600)
    create_tracer_mapping()
finally:
  observer.stop()
  observer.join()

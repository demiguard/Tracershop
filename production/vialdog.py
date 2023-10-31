if __name__ == '__main__':
  exit(1)

import os
import django
import logging

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()


from time import sleep
from pathlib import Path
from constants import VIAL_LOGGER, VIAL_WATCHER_FILE_PATH_ENV
from database.models import Vial
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent
from watchdog.observers.polling import PollingObserver as Observer

VIAL_WATCHER_FILE_PATH = os.environ(VIAL_WATCHER_FILE_PATH_ENV)
logger = logging.getLogger(VIAL_LOGGER)

def parse_val_file(file_content: str) -> Vial:
  pass # 

class VialFileHandler(FileSystemEventHandler):
  def on_any_event(self, event: FileSystemEvent):
    logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")

  def on_created(self, event: FileCreatedEvent):
    val_path = Path(event.src_path)

    with val_path.open("r") as fp:
      data = ''.join(fp.readlines())

    try:
      vial = parse_val_file(data)
      vial.save()
      val_path.unlink()
    except:
      logger.error("Failed to do stuff!")


observer = Observer()
observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, True)
observer.start()

try:
  while True:
    sleep(1)
finally:
  observer.stop()
  observer.join()

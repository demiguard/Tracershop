# Python standard library
from datetime import date, time
import io
import os
import logging
import re
from multiprocessing import Process
from threading import Thread
from pathlib import Path
from time import sleep
import traceback
from typing import Any, List

# Third party packages
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
from watchdog.observers.polling import PollingObserver as Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

# Tracershop packages:
from core.exceptions import EmptyFile

from constants import VIAL_LOGGER, VIAL_WATCHER_FILE_PATH_ENV, MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA,\
  WEBSOCKET_REFRESH, DATA_VIAL, WEBSOCKET_SERVER_MESSAGES, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_STATUS
from database.database_interface import DatabaseInterface
from database.models import Vial
from lib.parsing import parse_val_file, update_customer_mapping, update_tracer_mapping
from websocket.messenger import Messenger
from websocket.messenger_base import getNewMessageID

dbi = DatabaseInterface()
messenger = Messenger()

VIAL_WATCHER_FILE_PATH = os.environ[VIAL_WATCHER_FILE_PATH_ENV]
logger = logging.getLogger(VIAL_LOGGER)

def _get_file_contents(path: Path):
  if path.stat().st_size == 0:
    raise EmptyFile

  with io.open(path, "r", encoding="iso-8859-1") as fp:
    data = fp.readlines()

  if len(data) == 0:
    raise EmptyFile

  return data


def handle_path(path: Path):
  logger.debug("Aquiring channel Layer")
  channel_layer: RedisChannelLayer = get_channel_layer() # type: ignore
  logger.debug("Aquired channel Layer")

  try:
    file_content = _get_file_contents(path)
  except EmptyFile:
    logger.error(f"Path: {path} is an empty file, Ignoring it!")
    return
  except IOError as e:
    logger.error(f"Stale File handle for path: {path}")
    return
  except Exception as exception:
    logger.error(f"Unhandled exception: {exception}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return

  logger.debug(f"Read File content: {file_content}")
  vial = parse_val_file(file_content, logger)
  logger.debug(f"Parsed File to vial: {vial}")

  # Check if the vial exists already
  if Vial.objects.filter(fill_date=vial.fill_date, fill_time=vial.fill_time).exists():
    logger.info(f"Vial at {path} is a duplicate, removing file at {path}")
    path.unlink()
    return

  try:
    vial.save()
  except IntegrityError:
    logger.error(f"Path: {path} doesn't contain a valid val file")
    return
  except Exception as e:
    logger.error(f"Unknown exception of {e} encountered!")
  logger.info("Vial doesn't exists saving!")

  async_to_sync(messenger)(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
    WEBSOCKET_MESSAGE_ID : getNewMessageID(),
    MESSENGER_CONSUMER : None,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_REFRESH : False,
    WEBSOCKET_DATA : { DATA_VIAL : [vial]}
  })
  logger.info(f"Send vial to service, Deleting file: {path}")
  path.unlink()

def process_path(path: Path):
      logger.info(f"Started to process {path}")
      processed_path = False
      while not processed_path:
        process = Process(target=handle_path, args=[path])
        process.start()
        pid = process.pid
        process.join(2.0)
        if process.is_alive():
          process.terminate()
          logger.info(f"process {pid} timeouted!")
        else:
          processed_path = True
        process.close() #
      logger.info(f"Finished processing {path}")

def run_cleanup():
  vial_file_path = Path(VIAL_WATCHER_FILE_PATH)
  val_files = [f for f in vial_file_path.glob('VAL*')]
  for val_path in val_files:
    logger.info(f"Processing file {val_path}")
    handle_path(val_path)
    logger.info(f"Handled Path: {val_path}")

class VialFileHandler(FileSystemEventHandler):
  def on_any_event(self, event: FileSystemEvent):
    logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")

  def on_created(self, event: FileSystemEvent):
    logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")
    val_path = Path(str(event.src_path))
    val_thread = Thread(target=process_path, args=[val_path])
    val_thread.run()

  def on_modified(self, event: FileSystemEvent):
    if event.is_directory:
      return

    val_path = Path(str(event.src_path))
    handle_path(val_path)

class Command(BaseCommand):
  def handle(self, *args: Any, **options: Any) -> str | None:

    tracer_mapping = update_tracer_mapping()
    customer_mapping = update_customer_mapping()

    run_cleanup()

    logger.debug(f"Started with tracer mapping: {tracer_mapping}")
    logger.debug(f"Started with customer mapping: {customer_mapping}")
    observer = Observer()
    observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, recursive=True)
    observer.start()

    # Process files that might have been there earlier
    try:
      while True:
        sleep(60)
        if not observer.is_alive():
          logger.error("Vialdog died for reason hopefully in the logs. Restarting it!")
          observer.join()
          run_cleanup()
          observer = Observer()
          observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, recursive=True)
          observer.start()
    finally:
      observer.stop()
      observer.join()

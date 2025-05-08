# Python standard library
import io
import os
import logging
from multiprocessing import Process
from threading import Thread
from pathlib import Path
from time import sleep
import traceback
from typing import Any, List

# Third party packages
from asgiref.sync import async_to_sync

from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
from pandas import read_csv, read_excel, DataFrame
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
from database.utils import can_be_saved
from lib.parsing import parse_val_file, update_customer_mapping,\
  update_tracer_mapping, parse_data_frame_row_to_vial
from lib.formatting import toDateTime
from websocket.messenger import Messenger
from websocket.messenger_base import getNewMessageID

dbi = DatabaseInterface()
messenger = Messenger()

VIAL_WATCHER_FILE_PATH = os.environ[VIAL_WATCHER_FILE_PATH_ENV]
logger = logging.getLogger(VIAL_LOGGER)

def _get_file_contents(path: Path):
  if path.stat().st_size == 0:
    logger.error(f"Path: {path} is an empty file, Ignoring it!")
    raise EmptyFile

  try:
    with io.open(path, "r", encoding="iso-8859-1") as fp:
      data = fp.readlines()
  except Exception as exception:
    logger.error(f"Unhandled exception: {exception}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    raise exception

  if len(data) == 0:
    logger.error(f"Path: {path} is an empty file, Ignoring it!")
    raise EmptyFile

  return data

def handle_vial_file(path: Path):
  try:
    file_content = _get_file_contents(path)
  except EmptyFile:
    return

  logger.debug(f"Read File content: {file_content}")
  vial = parse_val_file(file_content, logger)
  logger.debug(f"Parsed File to vial: {vial}")

  # Check if the vial exists already
  if vial.is_duplicate():
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
    return
  logger.info("Vial doesn't exists saving!")

  send_vials_to_frontend([vial])
  logger.info(f"Send vial to service, Deleting file: {path}")
  path.unlink()

# There's a lot of overlap here, but whatever, I am sure that whatever
# abstraction I could come up with here is worse that 2 function of the same
# thing
#
def handle_csv_file(path: Path):
  try:
    data_frame = read_csv(path)
  except Exception as exception:
    logger.error(f"Unhandled exception: {exception}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return

  handle_data_frame(data_frame, path)

def handle_xlsx_file(path: Path):
  try:
    data_frame = read_excel(path)
  except Exception as exception:
    logger.error(f"Unhandled exception: {exception}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return
  handle_data_frame(data_frame, path)

def handle_data_frame(data_frame: DataFrame, path: Path):
  vials = parse_data_frame_row_to_vial(data_frame)
  vials_filtered_for_duplicates = [vial for vial in filter(Vial.is_duplicate, vials)]

  for vial in vials_filtered_for_duplicates:
    vial.save()

  send_vials_to_frontend(vials)
  path.unlink()


def send_vials_to_frontend(vials: List[Vial]):
  async_to_sync(messenger)(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
    WEBSOCKET_MESSAGE_ID : getNewMessageID(),
    MESSENGER_CONSUMER : None,
    WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    WEBSOCKET_REFRESH : False,
    WEBSOCKET_DATA : { DATA_VIAL : vials}
  })


def handle_path(path: Path):
  if path.name.startswith('VAL'):
    handle_vial_file(path)
  elif path.name.endswith('.csv'):
    handle_csv_file(path)
  elif path.name.endswith('.xlsx'):
    handle_xlsx_file(path)

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

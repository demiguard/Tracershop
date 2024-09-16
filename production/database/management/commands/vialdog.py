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
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db.utils import IntegrityError
from watchdog.observers.polling import PollingObserver as Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent

# Tracershop packages:
from core.exceptions import EmptyFile
from constants import VIAL_LOGGER, VIAL_WATCHER_FILE_PATH_ENV, CHANNEL_GROUP_GLOBAL
from shared_constants import WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE, DATA_VIAL, WEBSOCKET_MESSAGE_UPDATE_STATE
from database.database_interface import DatabaseInterface
from database.models import Vial, Tracer, Customer, User
from lib.parsing import parse_val_file, update_customer_mapping, update_tracer_mapping
from websocket.messages import getNewMessageID

dbi = DatabaseInterface()

VIAL_WATCHER_FILE_PATH = os.environ[VIAL_WATCHER_FILE_PATH_ENV]
logger = logging.getLogger(VIAL_LOGGER)

def _create_tracer_mapping():
  tracer_mapping = {}
  for tracer in Tracer.objects.all():
    if tracer.vial_tag is not None and tracer.vial_tag != "":
      tracer_mapping[tracer.vial_tag] = tracer

  return tracer_mapping

def _create_customer_mapping():
  customer_mapping = {}
  for customer in Customer.objects.all():
    if customer.dispenser_id is not None:
      customer_mapping[customer.dispenser_id] = customer

  return customer_mapping

def _get_file_contents(path: Path):
  if path.stat().st_size == 0:
    raise EmptyFile

  with io.open(path, "r", encoding="iso-8859-1") as fp:
    data = fp.readlines()

  return data


def handle_path(path: Path):
  logger.debug("Aquiring channel Layer")
  channel_layer = get_channel_layer()
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
    logger.info(f"Vial Exists at {path}")
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

  data = async_to_sync(dbi.serialize_dict)({
    DATA_VIAL : [vial]
  })
  logger.debug(f"Serialized dict to {data}")
  async_to_sync(channel_layer.group_send)(
            CHANNEL_GROUP_GLOBAL, {
                WEBSOCKET_MESSAGE_ID : getNewMessageID(),
                WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
                WEBSOCKET_DATA : data,
                WEBSOCKET_REFRESH : False,
                WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
                'type' : 'broadcastMessage',
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

  def on_created(self, event: FileCreatedEvent):
    logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")
    val_path = Path(event.src_path)
    val_thread = Thread(target=process_path, args=[val_path])
    val_thread.run()

  def on_modified(self, event: FileCreatedEvent):
    if event.is_directory:
      return

    val_path = Path(event.src_path)
    handle_path(val_path)


class Command(BaseCommand):
  def handle(self, *args: Any, **options: Any) -> str | None:

    tracer_mapping = _create_tracer_mapping()
    customer_mapping = _create_customer_mapping()

    run_cleanup()

    logger.debug(f"Started with tracer mapping: {tracer_mapping}")
    logger.debug(f"Started with customer mapping: {customer_mapping}")
    observer = Observer()
    observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, True)
    observer.start()

    # Process files that might have been there earlier
    try:
      while True:
        sleep(60)
        update_tracer_mapping()
        update_customer_mapping()
        if not observer.is_alive():
          logger.error("Vialdog died for reason hopefully in the logs. Restarting it!")
          observer.join()
          run_cleanup()
          observer = Observer()
          observer.schedule(VialFileHandler(), VIAL_WATCHER_FILE_PATH, True)
          observer.start()
    finally:
      observer.stop()
      observer.join()

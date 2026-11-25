"""This file is a small script, that handel printing vial labels.

The way this works is that you write data to a small file in the format:
$Customer,DD/MM/YY,$Batch,$Activity MBq,$Volume,$dispence,$Expiry
For example:
petf2,12/11/26,FDGF-261112-1,23132 MBq,12.72 ml,07:54,17:07

Then run the command:
glables-batch-3 label.glabels --output=file.pdf
lp -d ${label_printer} ${file}

Now labels.glabels is a gziped XML file, that contains a merge field, that
contains a filepath, which of cause must equal to the path written.

To edit the merge file in terminal:
zcat label.glabels > tmp.txt
nano tmp.txt
gzip -c tmp.txt > mod_labels.glabels

-  There's also an editor with `glabels-3 label.glabels`

Anywho to solve this and enforce the sequential nature of the pipeline:
- Scheduler, runs async, and the it's job is put things into a sequential queue
where the consumer can handle each task sequential.
- Consumer a thread that reads off a queue and does the printing sequentially


"""

import asyncio
import signal
import subprocess
from argparse import ArgumentParser
from datetime import datetime, timedelta
from queue import Queue, Empty
from logging import getLogger
from pathlib import Path
from threading import Thread, Event as ThreadEvent
from zoneinfo import ZoneInfo

# Third party Modules
from asgiref.sync import sync_to_async
from channels.layers import BaseChannelLayer, get_channel_layer
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.management import BaseCommand, CommandError

from constants import DEBUG_LOGGER, ERROR_LOGGER
from database.TracerShopModels.customerModels import Vial
from database.TracerShopModels.serverModels import ServerConfiguration
from lib.formatting import format_time_number
from shared_constants import DATA_VIAL

CHANNEL_PRINT_VIAL = "print-vial"

ARG_NAME_GLABEL_COMMAND = "glabels_command"
ARG_NAME_GLABEL_FILE = "glabels_file"
ARG_NAME_LABEL_DATA_FILE = "label_data_file"
ARG_NAME_LABEL_OUTPUT = "glabel_output_file"

class Command(BaseCommand):
  def add_arguments(self, parser: ArgumentParser):
    parser.add_argument(ARG_NAME_GLABEL_COMMAND, type=str, help="A")
    parser.add_argument(ARG_NAME_GLABEL_FILE, type=Path, help="B")
    parser.add_argument(ARG_NAME_LABEL_DATA_FILE, type=Path, help="C")
    parser.add_argument(ARG_NAME_LABEL_OUTPUT, type=Path, help="D")

  def handle(self, *args, **options):

    if ARG_NAME_GLABEL_COMMAND not in options or\
      ARG_NAME_GLABEL_FILE not in options or\
      ARG_NAME_LABEL_DATA_FILE not in options or \
      ARG_NAME_LABEL_OUTPUT not in options:
        raise CommandError("Missing an Arg, check help")

    self.ARG_NAME_GLABEL_COMMAND: str = options[ARG_NAME_GLABEL_COMMAND]
    self.ARG_NAME_GLABEL_FILE: Path = options[ARG_NAME_GLABEL_FILE]
    self.ARG_NAME_LABEL_DATA_FILE: Path = options[ARG_NAME_LABEL_DATA_FILE]
    self.ARG_NAME_LABEL_OUTPUT: Path = options[ARG_NAME_LABEL_OUTPUT]

    asyncio.run(self.main())


  async def main(self):
    logger = getLogger(DEBUG_LOGGER)
    logger.info("Hello world from vial printing - async loop")

    stop_event = asyncio.Event()
    thread_event = ThreadEvent()
    vial_queue = Queue()

    def signal_handler(signal_, frame):
      thread_event.set()
      stop_event.set()

    for signal_ in (signal.SIGINT, signal.SIGTERM):
      signal.signal(signal_, signal_handler)

    layer = get_channel_layer()

    if layer is None:
      raise CommandError("Unable to aquire channel layer")

    synchronizer = asyncio.create_task(self.synchronize(layer, stop_event, vial_queue))
    consumer = Thread(target=self.consume, args=(thread_event, vial_queue))
    consumer.start()

    await synchronizer
    await stop_event.wait()


  def handle_print_event(self, msg):
    debug_logger = getLogger(DEBUG_LOGGER)
    debug_logger.info(f"Printing message: {msg}")
    if DATA_VIAL not in msg:
      logger = getLogger(ERROR_LOGGER)
      logger.error(f"Incorrect message format for print-vial message: {msg} - Missing {DATA_VIAL} message key")
      return

    if not isinstance(msg[DATA_VIAL], int):
      logger = getLogger(ERROR_LOGGER)
      logger.error(f"Incorrect message format for print-vial message: {msg} - {DATA_VIAL} is not an vial id")
      return

    try:
      vial = Vial.objects.get(pk=msg[DATA_VIAL])
    except ObjectDoesNotExist:
      logger = getLogger(ERROR_LOGGER)
      logger.error(f"Could not find vial {msg[DATA_VIAL]} for printing")
      return

    server_config = ServerConfiguration.get()

    if server_config.active_label_printer is None:
      logger = getLogger(ERROR_LOGGER)
      logger.error(f"Could not print vial {msg[DATA_VIAL]} as there's no label printer set in Configuration.")
      return

    printer = server_config.active_label_printer

    expiry_time = vial.expiry if vial.expiry is not None else datetime.combine(vial.fill_date, vial.fill_time, tzinfo=ZoneInfo("Europe/Copenhagen")) + timedelta(hours=8)
    #example file content:
    #petf2,12/11/26,FDGF-261112-1,23132 MBq,12.72 ml,07:54,17:07
    formatted_vial_data: list[str] = [
      vial.owner.short_name if vial.owner is not None else "ukendt",
      f"{format_time_number(vial.fill_date.day)}/{format_time_number(vial.fill_date.month)}/{format_time_number(vial.fill_date.year)[2:]}",
      vial.lot_number,
      f"{int(vial.activity)} MBq",
      f"{vial.volume} ml",
      f"{format_time_number(vial.fill_time.hour)}:{format_time_number(vial.fill_time.minute)}",
      f"{format_time_number(expiry_time.hour)}:{format_time_number(expiry_time.minute)}"
    ]

    with self.ARG_NAME_LABEL_DATA_FILE.open("w") as fp:
      fp.write(",".join(formatted_vial_data))

    glabel_batch_command = self.ARG_NAME_GLABEL_COMMAND.split(" ") + [self.ARG_NAME_GLABEL_FILE, f"--output={str(self.ARG_NAME_LABEL_OUTPUT)}"]

    try:
      subprocess.run(glabel_batch_command, check=True)
    except:
      logger = getLogger(ERROR_LOGGER)
      return

    printing_command = ["lp", "-n", "2", "-d", printer.name, str(self.ARG_NAME_LABEL_OUTPUT)]

    if not settings.DEBUG:
      try:
        subprocess.run(printing_command, check=True)
      except subprocess.CalledProcessError:
        logger = getLogger(ERROR_LOGGER)
        logger.error(f"{printing_command} FAILED!")

    else:
      logger = getLogger(DEBUG_LOGGER)
      logger.info(f"We would have run a command: {printing_command}, but because the system is in DEBUG mode it didn't")

  async def synchronize(self, layer: BaseChannelLayer, stop_event: asyncio.Event, queue: Queue):
    try:
      while not stop_event.is_set():
        try:
          msg = await asyncio.wait_for(layer.receive(CHANNEL_PRINT_VIAL), timeout=1.0)
        except TimeoutError:
          continue

        queue.put(msg)
    except BaseException:
      import traceback;
      traceback.print_exc()
      raise

  def consume(self, thread_event: ThreadEvent, queue: Queue):
    logger = getLogger(DEBUG_LOGGER)
    logger.info("Hello from vial printing consumer thread!")
    while not thread_event.is_set():
      try:
        msg = queue.get(timeout=5.0)
      except Empty:
        continue

      try:
        self.handle_print_event(msg)
      finally:
        queue.task_done()

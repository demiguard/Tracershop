if __name__ != '__main__':
  exit(1)

import sys
from shutil import copy
from os import stat, environ
from time import sleep
from pathlib import Path
from logging import basicConfig, getLogger
from logging.handlers import TimedRotatingFileHandler

if 'COPYDOG_LOG' in environ:
  basicConfig(
    handlers=[TimedRotatingFileHandler(filename=environ['COPYDOG_LOG'],
                                       when='w',
                                       backupCount=5)]
  )

logger = getLogger()



if len(sys.argv) != 3:
  print("Usage: copydog.py src dst")
  exit(1)

src_path = sys.argv[1] # So the library converts to str from path lol
dst_path = sys.argv[2] # So the library converts to str from path lol


def copy_file(src_file, dst_file):
  copy(src_file, dst_file)
  sleep(0.5)
  src_stats = stat(src_file)
  dst_stats = stat(dst_file)

  if src_stats.st_size != dst_stats.st_size:
    # Assume we have failed to parse on the other side
    copy_file(src_file, dst_file)


if(src_path == dst_path):
  print("Source and Destination Path cannot be the same!")

from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent
from watchdog.observers.polling import PollingObserver as Observer

class CopyFileHandler(FileSystemEventHandler):
  #def on_created(self, event: FileCreatedEvent):
  #  try:
  #    src_file = Path(event.src_path)
  #    dst_file = Path(dst_path) / src_file.name
  #    copy_file(src_file, dst_file)
  #  except OSError:
  #    print("wopsy")

  def on_modified(self, event: FileCreatedEvent):
    if event.is_directory:
      return
    try:
      src_file = Path(event.src_path)
      dst_file = Path(dst_path) / src_file.name
      copy_file(src_file, dst_file)
    except OSError:
      print("wopsy")

observer = Observer()
observer.schedule(CopyFileHandler(), src_path, True)
observer.start()

try:
  while True:
    sleep(600)
finally:
  observer.stop()
  observer.join()
if __name__ != '__main__':
  exit(1)

import sys
from shutil import copy
from time import sleep
from pathlib import Path

if len(sys.argv) != 3:
  print("Usage: copydog.py src dst")
  exit(1)

src_path = sys.argv[1] # So the library converts to str from path lol
dst_path = sys.argv[2] # So the library converts to str from path lol

if(src_path == dst_path):
  print("Source and Destination Path cannot be the same!")

from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent
from watchdog.observers.polling import PollingObserver as Observer

class CopyFileHandler(FileSystemEventHandler):
  def on_any_event(self, event: FileSystemEvent):
    #logger.info(f"Got a file event: {event.__class__.__name__} at {event.src_path}")
    pass

  def on_created(self, event: FileCreatedEvent):
    print(f"on_created triggered with {event.src_path}")
    src_file = Path(event.src_path)
    dst_file = Path(dst_path) / src_file.name
    copy(src_file, dst_file)

  def on_modified(self, event: FileCreatedEvent):
    print(f"on_modified triggered with {event.src_path}")
    if event.is_directory:
      return
    src_file = Path(event.src_path)
    dst_file = Path(dst_path) / src_file.name
    copy(src_file, dst_file)

observer = Observer()
observer.schedule(CopyFileHandler(), src_path, True)
observer.start()

try:
  while True:
    sleep(600)
finally:
  observer.stop()
  observer.join()
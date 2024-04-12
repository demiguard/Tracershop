import argparse
from pathlib import Path

def get_args():
  parser = argparse.ArgumentParser()

  parser.add_argument("type", choices=['v', 'i', 'a'],
                      help="If the file is a vial, injection or activity file")
  parser.add_argument("data_file", help="path to the file, must exists", type=Path)

  parser.add_argument('-s', '--save', action='store_true')
  args = parser.parse_args()

  if not args.data_file.exists():
    raise Exception("Data file must exists")

  return args


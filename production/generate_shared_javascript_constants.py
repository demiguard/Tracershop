"""This takes the shared constants and creates a js file with export constants. Shared constants are keywords used in json objects by the websocket"""


if __name__ != "__main__":
  print("YOU HAVE IMPORTED A SCRIPT: generate_shared_javascript_constants! EXITING!")
  exit(1)

from typing import List

import shared_constants

constants = [(key, value) for (key,value) in shared_constants.__dict__.items() if not key.startswith('__')]
constants.sort(key=lambda t1: t1[0])

key_group = ""

with open('frontend/src/lib/shared_constants.js', 'w') as out:
  out.write("/* GENERATED FILE, DO NOT EDIT, if this file needs to be changed edit\n")
  out.write("generate_shared_javascript_constants.py\n\n")
  out.write("This file contains the shard constants between the frontend and the backend\n")
  out.write("Note that, these constants are also used for database indexes */\n")

  for (key, value) in constants:
    current_key_group = key.split('_')[0]

    if current_key_group != key_group:
      key_group = current_key_group
      out.write("\n")

    if isinstance(value, str):
      out.write(f"export const {key} = \"{value}\";\n")

    if isinstance(value, List):
      out.write(f"export const {key} = [\n")
      for val in value:
        out.write(f"  \"{val}\",\n")
      out.write("]\n")


"""This takes the shared constants and creates a js file with export constants. Shared constants are keywords used in json objects by the websocket"""
import sys

if __name__ != '__main__':
  print("you have imported a script you dummy!")
  sys.exit(1)

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

from database.models import MODELS

curly_brace_left = "{"
curly_brace_right = "}"


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

with open('frontend/src/dataclasses/dataclasses.js', 'w') as out:
  out.write("/**Automatically generated file by generate JavascriptDataClasses.py */\n")
  out.write("/**Contains a mapping of the database and their fields. */\n\n")


  for model in MODELS.values():
    out.write(f"export class {model.__name__} {{\n")
    out.write("  constructor(")
    for field in model._meta.fields:
      if field.name in model.exclude:
        continue
      out.write(f"{field.name}, ")
    out.write(f") {curly_brace_left}\n")
    for field in model._meta.fields:
      if field.name in model.exclude:
        continue
      out.write(f"    this.{field.name}={field.name}\n")
    out.write("  }\n")
    out.write("}\n\n")

  out.write("export const MODELS = {\n")
  for key, model in MODELS.items():
    out.write(  f"  {key} : {model.__name__},\n")
  out.write("}\n")

  out.write("\nexport class TracershopState {\n")
  out.write(f"  /** @type {{ User }} */ logged_in_user\n")

  for key, model in MODELS.items():
    out.write(f"  /** @type {{ Map<Number, {model.__name__}>}} */ {key}\n")

  out.write("\n  constructor(logged_in_user, ")
  for key, model in MODELS.items():
    out.write(f"{key}, ")
  out.write("){\n    this.logged_in_user=logged_in_user\n")
  for key, model in MODELS.items():
    out.write(f"    if({key} !== undefined){{\n")
    out.write(f"      this.{key} = {key}\n")
    out.write("    } else {\n")
    out.write(f"      this.{key} = new Map()\n")
    out.write("    }\n")
  out.write("  }\n")
  out.write("}\n")

with open('frontend/src/dataclasses/keywords.js', 'w') as out:
  out.write("/**Automatically generated file by generate JavascriptDataClasses.py */\n")
  out.write("/**Contains all keywords used by database */\n\n")

  for model in MODELS.values():
    out.write(f"// Model: {model.__name__}\n")
    for field in model._meta.fields:
      out.write(f"export const KEYWORD_{model.__name__}_{field.name.upper()} = \"{field.name}\";\n")

    out.write("\n")
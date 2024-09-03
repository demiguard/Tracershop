# Python Standard library
from pathlib import Path
from enum import Enum
from typing import Any, List

# Third party packages
from django.db.models import Field
from django.core.management.base import BaseCommand, CommandError, CommandParser

# Tracershop packages
from database.models import MODELS
import shared_constants

def serialize_field(field: Field) -> str:
  return f"new DatabaseField({field.name})"



class Command(BaseCommand):
  help="""Moves the python constants that should be used by the frontend,
 into a javascript file, that the frontend can use"""

  def handle(self, *args: Any, **options: Any) -> str | None:
    key_group = ""
    constants = [(key, value) for (key,value) in shared_constants.__dict__.items() if not key.startswith('__')]
    constants.sort(key=lambda t1: t1[0])

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

        if isinstance(value, type) and issubclass(value, Enum):
          out.write(f"export const {key} = {{\n")
          for val in value:
            out.write(f"  {val.name} : {val.value},\n")
          out.write(f"}};\n")
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
        out.write(") {\n")
        for field in model._meta.fields:
          if field.name in model.exclude:
            continue
          out.write(f"    this.{field.name}={field.name}\n")
        out.write("  }\n\n")
        out.write(f"  /**Copies the {model.__name__.lower()}\n")
        out.write(f"  * @returns {{ {model.__name__} }}\n")
        out.write("   */\n")
        out.write("  copy(){\n")
        out.write("    return new this.constructor(\n")
        for i,field in enumerate(model._meta.fields):
          if field.name in model.exclude:
            continue
          out.write(f"      this.{field.name}")
          if i != len(model._meta.fields) -1: # Note there is a bug here if the last field is in exclude
            out.write(",")
          out.write("\n")
        out.write("    )\n")
        out.write("  }\n")
        out.write("  fields(){\n")
        out.write("    return [\n")
        for i,field in enumerate(model._meta.fields):
          if field.name in model.exclude:
            continue

          out.write(f"      {serialize_field(field)},\n")
        out.write("    ];\n")
        out.write("  }\n")
        out.write("}\n\n")

      out.write("export const MODELS = {\n")
      for key, model in MODELS.items():
        out.write(  f"  {key} : {model.__name__},\n")
      out.write("}\n")

      out.write("\nexport class TracershopState {\n")
      out.write(f"  /** @type {{ User }} */ logged_in_user\n")
      out.write(f"  /** @type {{ Date }} */ today\n")
      out.write(f"  /** @type {{ Number }} */ readyState\n")

      for key, model in MODELS.items():
        if key not in shared_constants.EXCLUDED_STATE_MODELS:
          out.write(f"  /** @type {{ Map<Number, {model.__name__}>}} */ {key}\n")

      out.write("\n  constructor(logged_in_user, today, ")
      for key, model in MODELS.items():
        if key not in shared_constants.EXCLUDED_STATE_MODELS:
          out.write(f"{key}, ")
      out.write("){\n    this.logged_in_user=logged_in_user\n")
      out.write("    this.today=today\n")
      out.write("   this.readyState = WebSocket.CLOSED\n")
      for key, model in MODELS.items():
        if key in shared_constants.EXCLUDED_STATE_MODELS:
          continue
        out.write(f"    if({key} !== undefined){{\n")
        out.write(f"      this.{key} = {key}\n")
        out.write("    } else {\n")
        out.write(f"      this.{key} = new Map()\n")
        out.write("    }\n")
      out.write("  }\n")
      out.write("}\n")

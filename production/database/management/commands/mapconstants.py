"""This module generates the javascript files, """

# Python Standard library
from pathlib import Path
from enum import Enum
from typing import Any, List

# Third party packages
from django.db.models import CharField, Field, FloatField, ForeignKey,\
    IntegerField,DateField, DateTimeField, TimeField, BooleanField, TextField,\
    IPAddressField, GenericIPAddressField
from django.core.management.base import BaseCommand, CommandError, CommandParser

# Tracershop packages
from database.models import MODELS, INVERTED_MODELS
import shared_constants
from lib.formatting import format_message_name

def serialize_field(field: Field) -> str:
  if isinstance(field, BooleanField):
    return f"new BooleanField(\"{field.name}\")"
  if isinstance(field, CharField) or isinstance(field, TextField):
    return f"new CharField(\"{field.name}\")"
  if isinstance(field, IntegerField):
    return f"new IntField(\"{field.name}\")"
  if isinstance(field, FloatField):
    return f"new FloatField(\"{field.name}\")"
  if isinstance(field, DateTimeField):
    return f"new DateTimeField(\"{field.name}\")"
  if isinstance(field, DateField):
    return f"new DateField(\"{field.name}\")"
  if isinstance(field, TimeField):
    return f"new DateField(\"{field.name}\")"
  if isinstance(field, IPAddressField) or isinstance(field, GenericIPAddressField):
    return f"new IPField(\"{field.name}\")"
  if isinstance(field, ForeignKey):
    other_name = INVERTED_MODELS[field.related_model]
    return f"new ForeignField(\"{field.name}\",\"{other_name}\")"

  print(field)
  return f"new DatabaseField({field.name})"

def serialize_value(val):
  if(isinstance(val, str)):
    return f"\"{val}\""
  return val

def serial_messengers() -> str:
  from websocket.messenger import Messenger

  grand_messenger = Messenger()

  file_content = """/* GENERATED FILE by python3 manage.py mapconstants, DO NOT EDIT!
This file consist of messages coming from the server. */
import { WEBSOCKET_MESSAGE_TYPE } from \"~/lib/shared_constants.js\"
import { deserialize } from \"~/lib/serialization.js\"
import {
"""
  for message_type in grand_messenger.messengers:
    file_content += f"  {message_type.name},\n"

  file_content += "} from \"~/lib/shared_constants.js\"\n\n"


  for message_type, messenger in grand_messenger.messengers.items():
    blueprint = messenger.message_blueprint

    file_content += blueprint.to_javascript(message_type)
    file_content += "\n"

  file_content += "export const MESSAGES = {\n"
  for message_type in grand_messenger.messengers:
    file_content += f"  [{message_type.name}] : {format_message_name(message_name=message_type.name)},\n"
  file_content += "}\n"

  file_content += """
export function createMessage(valid_message){
  return new MESSAGES[valid_message[WEBSOCKET_MESSAGE_TYPE]](valid_message);
}
"""

  return file_content

class Command(BaseCommand):
  help="""Moves the python constants that should be used by the frontend,
 into a javascript file, that the frontend can use"""

  def handle(self, *args: Any, **options: Any) -> str | None:
    key_group = ""
    constants = [(key, value) for (key,value) in shared_constants.__dict__.items() if not key.startswith('__')]
    constants.sort(key=lambda t1: t1[0])

    with open('frontend/src/lib/incoming_messages.js', 'w') as messages:
      messages.write(serial_messengers())

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
            if isinstance(val.value, str):
              out.write(f"  {val.name} : {val.name},\n")
            else:
              out.write(f"  {val.name} : {(serialize_value(val.value))},\n")
          out.write(f"}};\n")
        if isinstance(value, List):
          out.write(f"export const {key} = [\n")
          for val in value:
            out.write(f"  \"{val}\",\n")
          out.write("]\n")

    with open('frontend/src/dataclasses/dataclasses.tsx', 'w') as out:
      out.write("/**Automatically generated file by generate JavascriptDataClasses.py */\n")
      out.write("/**Contains a mapping of the database and their fields. */\n\n")
      out.write("import { DatabaseField, BooleanField, CharField, IPField, DateField, DateTimeField, IntField, FloatField, ForeignField } from '~/lib/database_fields.js'\n\n")


      out.write("export class Dataclass {\n")
      out.write("  constructor(){}\n")
      out.write("  copy(){}\n")
      out.write("  fields() : Array<DatabaseField> {\n")
      out.write("    return []\n")
      out.write("  }\n")
      out.write("}\n")

      for model in MODELS.values():
        out.write(f"export class {model.__name__} extends Dataclass {{\n")
        for field in model._meta.fields:
          if field.name in model.exclude:
            continue
          out.write(f"  {field.name}\n")

        for prop in model.derived_properties: #type: ignore
          out.write(f"  {prop}\n")

        out.write("\n")


        out.write("  constructor(")
        for field in model._meta.fields:
          if field.name in model.exclude:
            continue
          out.write(f"{field.name}?, ")
        for derived_property in model.derived_properties: # type: ignore
          out.write(f"{derived_property}?, ")
        out.write(") {\n")
        out.write("    super()\n")
        for field in model._meta.fields:
          if field.name in model.exclude:
            continue
          out.write(f"    this.{field.name}={field.name}\n")
        for derived_property in model.derived_properties: # type: ignore
          out.write(f"    this.{derived_property}={derived_property}\n")
        out.write("  }\n\n")
        out.write(f"  /**Copies the {model.__name__.lower()}\n")
        out.write(f"  * @returns {{ {model.__name__} }}\n")
        out.write("   */\n")
        out.write(f"  copy() : {model.__name__} {{\n")
        out.write(f"    return new {model.__name__}(\n")
        for i,field in enumerate(model._meta.fields):
          if field.name in model.exclude:
            continue
          out.write(f"      this.{field.name}")
          if i != len(model._meta.fields) -1 or model.derived_properties != []: # Note there is a bug here if the last field is in exclude
            out.write(",")
          out.write("\n")
        for i, derived_property in enumerate(model.derived_properties): # type: ignore
          out.write(f"      this.{derived_property}")
          if i != len(model.derived_properties) - 1: # type: ignore
            out.write(',')
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
      out.write(f"  logged_in_user :  User\n")
      out.write(f"  today: Date\n")
      out.write(f"  readyState: number\n")
      out.write( "  error: string \n")

      for key, model in MODELS.items():
        if key not in shared_constants.EXCLUDED_STATE_MODELS:
          out.write(f"  {key} : Map<number, {model.__name__}>\n")

      out.write("\n  constructor(logged_in_user?, today?, ")
      for key, model in MODELS.items():
        if key not in shared_constants.EXCLUDED_STATE_MODELS:
          out.write(f"{key}?, ")
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
      out.write("  this.error = \"\";\n")
      out.write("  }\n")
      out.write("}\n")

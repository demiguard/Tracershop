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


with open('frontend/src/dataclasses/dataclasses.js', 'w') as out:
  out.write("/**Automatically generated file by generate JavascriptDataClasses.py */\n")
  out.write("/**Contains a mapping of the database and their fields. */\n\n")


  for model in MODELS.values():
    out.write(f"export class {model.__name__} {curly_brace_left}\n")
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
  out.write("}\n\n")

with open('frontend/src/dataclasses/keywords.js', 'w') as out:
  out.write("/**Automatically generated file by generate JavascriptDataClasses.py */\n")
  out.write("/**Contains all keywords used by database */\n\n")

  for model in MODELS.values():
    out.write(f"// Model: {model.__name__}\n")
    for field in model._meta.fields:
      out.write(f"export const KEYWORD_{model.__name__}_{field.name.upper()} = \"{field.name}\";\n")

    out.write("\n")
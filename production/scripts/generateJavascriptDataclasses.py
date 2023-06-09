import sys

if __name__ != '__main__':
  print("you have imported a script you dummy!")
  sys.exit(1)

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

curly_brace_left = "{"
curly_brace_right = "}"

with open(sys.stdout, 'w') as out:
  for model in django.apps.get_models():
    out.write(f"export class {model.__name__} {curly_brace_left}\n")
    out.write("  constructor(")
    for field in model._meta.fields:
      out.write(f"{field.name}, ")
    out.write(f") {curly_brace_left}\n")
    for field in model._meta.fields:
      out.write(f"    this.{field.name}={field.name}\n")
    out.write("  }\n")
    out.write("\n\n")

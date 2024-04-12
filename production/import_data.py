import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

from data_scripts.script_args import get_args
from data_scripts.parse_activity import parse_activity_orders
from data_scripts.parse_injections import parse_injections
from data_scripts.parse_vials import parse_vials
from pathlib import Path

def get_file_content(file_path: Path):
  with file_path.open() as fp:
    data = fp.readlines()

  return data[1:]

if __name__ == '__main__':
  args = get_args()

  content = get_file_content(args.data_file)

  if args.type == 'v':
    models, TM = parse_vials(content)
  if args.type == 'i':
    models, TM = parse_injections(content)
  if args.type == 'a':
    models, TM = parse_activity_orders(content)

  if 'models' not in locals():
    exit(1)

  if args.save:
    TM.objects.bulk_create(models)



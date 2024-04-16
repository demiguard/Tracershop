# Python Standard library
from pathlib import Path

# Third party packages
from django.core.management.base import BaseCommand, CommandError, CommandParser

# Tracershop packages
from database.management.old_database.parse_activity import parse_activity_orders
from database.management.old_database.parse_vials import parse_vials
from database.management.old_database.parse_injections import parse_injections

def _get_file_content(file_path: Path):
  with file_path.open() as fp:
    data = fp.readlines()

  return data[1:]


class Command(BaseCommand):
  help="Test if stuff happened"

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument("type", choices=['v', 'i', 'a'],
                        help="If the file is a vial, injection or activity"
                          " file")
    parser.add_argument("data_file",
                        help="path to the file, must exists",
                        type=Path)
    parser.add_argument('-s', '--save', action='store_true', help="Stores the "
                        "created data instead of constructing the classes")

  def handle(self, *args, **options):
    data_filepath: Path = options['data_file']
    if not data_filepath.exists():
      raise CommandError("Data file must exists.")

    if data_filepath.is_dir():
      raise CommandError("Data file cannot be a directory.")

    content = _get_file_content(data_filepath)

    if options['type'] == 'v':
      models, TM = parse_vials(content)
    if options['type'] == 'i':
      models, TM = parse_injections(content)
    if options['type'] == 'a':
      models, TM = parse_activity_orders(content)

    if 'models' not in locals():
      raise CommandError("Undefined import type")

    if options['save']:
      TM.objects.bulk_create(models)

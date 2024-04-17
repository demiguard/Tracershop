# Python Standard library
from pathlib import Path
from datetime import date, time, datetime


# Third party packages
from django.core.management.base import BaseCommand, CommandError, CommandParser

# Tracershop packages
from database.models import InjectionOrder, Vial, ActivityOrder, MODELS
from database.management.old_database.parse_activity import parse_activity_orders
from database.management.old_database.parse_vials import parse_vials
from database.management.old_database.parse_injections import parse_injections
from lib.formatting import toDate

supported_types = ['v', 'i', 'a']
types_help = "If the file is a vial, injection or activity file"

def valid_answers(input_str):
  if input_str in ["y", "yes", "no", "n", ""]:
    return True
  return False

def getModel(a_type):
  if a_type == "v":
    return Vial

  if a_type == "i":
    return InjectionOrder

  if a_type == "a":
    return ActivityOrder

def _get_file_content(file_path: Path):
  with file_path.open() as fp:
    data = fp.readlines()
  return data[1:]


def handle_import(options):
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

def handle_show(options):
  model_type = getModel(options['type'])

  if(options['date_from'] is not None):
    date_from = toDate(options['date_from'])
  else:
    date_from = date.today()

  if(options['date_to'] is not None):
    date_from = toDate(options['date_from'])
  else:
    date_from = date.today()


  print(options)

def handle_delete(options):
  model_type = getModel(options['type'])

  if(not options['force']):
    answer = "notValid!"

    while valid_answers(answer):
      answer = input(f"Are you sure you wish to delete () {model_type.__name__}s\n:")



class Command(BaseCommand):
  help="Test if stuff happened"

  def add_arguments(self, parser: CommandParser) -> None:
    sub_parsers = parser.add_subparsers(help="Data view mode", dest="command")
    import_parser = sub_parsers.add_parser("import", help="")
    import_parser.add_argument("type", choices=supported_types, help=types_help)

    show_parser = sub_parsers.add_parser("show", help="")
    show_parser.add_argument("type", choices=supported_types, help=types_help)
    show_parser.add_argument("date_from", nargs='?')
    show_parser.add_argument("date_to", nargs='?')

    delete_parser = sub_parsers.add_parser("delete", help="")
    delete_parser.add_argument("type", choices=supported_types, help=types_help)
    delete_parser.add_argument("--force", action="store_true")

  def handle(self, *args, **options):
    command = options['command']
    if(command is None):
      raise CommandError("You need a command to execute, you can use import, show, delete")

    if(command == 'import'):
      handle_import(options)

    if(command == 'show'):
      handle_show(options)

    if(command == 'delete'):
      handle_delete(options)
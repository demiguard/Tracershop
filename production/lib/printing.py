"""Handles side effects from printing.

Since printing have side effect this is mostly here to
"""
# Python standard library
from io import StringIO
from logging import getLogger
from pathlib import Path
import subprocess
from typing import Optional

# Third party library
from channels.db import database_sync_to_async
from django.conf import settings

# Tracershop packages
from constants import DEBUG_LOGGER
from lib.rendering import render_vial_template
from database.TracerShopModels.customerModels import Vial
from database.TracerShopModels.serverModels import Printer, VialTemplate


def is_printer_installed(printer: Printer):
  return subprocess.run(['lpstat', '-v', printer.name]).returncode == 0

def test_print(printer_id):
  printer = Printer.objects.get(pk=printer_id)

  if(not is_printer_installed(printer)):
    pass


def print_document(vial: Vial, printer: Printer, vial_template: VialTemplate, number_of_copies: Optional[int] = None):
  logger = getLogger(DEBUG_LOGGER)
  if vial_template.text is None:
    logger.info(f"Avoiding printing {vial_template.title} because it has no text")
    return

  if number_of_copies is None:
    number_of_copies = vial_template.print_count

  if number_of_copies <= 0:
    logger.info(f"Avoiding printing {vial_template.title} because it should be printed 0 times")
    return

  raw_document_text = render_vial_template(vial, vial_template.text)

  if not settings.DEBUG: # pragma: no cover
    logger.info(f"Printed {number_of_copies} copies of {vial_template.title} on {printer.name}")
    subprocess.run(["lp", "-d", printer.name, "-n", str(number_of_copies) ], input=raw_document_text, text=True)
  else:
    logger.info("Avoided printing a document, because I'm in debug mode!")


def print_documents_for_vial(vial: Vial, printer: Printer):
  for template in VialTemplate.objects.filter(
    text__isnull=False,
    print_count__gt=0
  ):
    print_document(vial, printer, template)


def print_label_for_vial(vial: Vial, printer: Printer):
  pass

"""Handles side effects from printing.

Since printing have side effect this is mostly here to
"""

# Python standard library
import subprocess

# Third party library

# Tracershop packages
from core.exceptions import IllegalActionAttempted
from database.TracerShopModels.serverModels import Printer

def is_printer_installed(printer: Printer):
  if Printer.valid_printer_names.fullmatch(printer.name) is None:
    raise IllegalActionAttempted
  return subprocess.run(['lpstat', '-v', printer.name]).returncode == 0

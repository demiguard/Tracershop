"""Handles side effects from printing.

Since printing have side effect this is mostly here to
"""

# Python standard library
from pathlib import Path
from io import StringIO
import subprocess

# Third party library
from channels.db import database_sync_to_async

# Tracershop packages
from database.TracerShopModels.customerModels import Vial
from database.TracerShopModels.serverModels import Printer

def is_printer_installed(printer: Printer):
  return subprocess.run(['lpstat', '-v', printer.name]).returncode == 0

def test_print(printer_id):
  printer = Printer.objects.get(pk=printer_id)

  if(not is_printer_installed(printer)):
    pass

def get_vial_label_path(vial:Vial):
  customer_name = vial.owner.short_name if vial.owner is not None else "Missing"

  return Path(f'vial_labels/{customer_name}_{vial.id}')


def create_label_tex_file(vial: Vial):
  return fr"""\documentclass{{article}}

\usepackage{{geometry}}
\geometry{{
  papersize={{17.48cm, 10.8cm}},
  margin=1.5cm
}}

\usepackage{{nopageno}}

\usepackage{{graphicx}}


\begin{{document}}
\Large

\noindent
\begin{{minipage}}{{0.59\textwidth}}
  Batch nr: {vial.lot_number}\\
  Sporestof: {vial.tracer}\\
  Aktivitet: {vial.activity}\\
  Volumen: {vial.volume}\\
  Kalibrerings tidspunkt: {vial.fill_time}\\
  Produceret: {vial.fill_date.strftime("%d-%m-%Y")}\\
  Kunde: {vial.owner}
\end{{minipage}}
\hspace{{0.05\textwidth}}
\begin{{minipage}}{{0.25\textwidth}}
  \begin{{center}}
    \includegraphics[width=1\textwidth]{{pdfData/radioactive.png}}
  \end{{center}}
\end{{minipage}}

\end{{document}}
"""

@database_sync_to_async
def create_document(vial: Vial):
  base_path = get_vial_label_path(vial)
  tex_file_content = create_label_tex_file(vial)

  tex_path = Path(base_path.name + '.tex')

  with open(tex_path, 'w') as fp:
    fp.write(tex_file_content)

  subprocess.call(
    ['xelatex', "-input-directory=pdfData","-output-directory=vial_labels", tex_path.name],
    stdout=StringIO(),
    stderr=StringIO(),
  )
  aux_file = Path(base_path.name + '.aux')
  aux_file.unlink()
  log_file = Path(base_path.name + '.log')
  log_file.unlink()

  return Path(base_path.name + '.pdf')

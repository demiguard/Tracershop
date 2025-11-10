# Python Standard library
from pathlib import Path
from typing import IO, Optional

# Third part modules:
from reportlab.graphics.shapes import Drawing, Image


## Django
from django.conf import settings

## Report Lab
from reportlab.graphics.shapes import String
from reportlab.graphics import renderPS
from reportlab.lib.units import mm, inch

# Tracershop modules
from database.models import Vial, ServerConfiguration
from lib.formatting import format_phone_number
from lib.pdf_generation import Cursor, TracershopCanvas, defaultFont

radioactive_path = Path(f"{settings.BASE_DIR}/pdfData/radioactive.jpg")

class VialLabel(TracershopCanvas):
  def __init__(self, filename: str | IO[bytes], vial: Optional[Vial] = None, *args) -> None:
    page_size = (0.6 * inch, 1.2 * inch)
    font_size = 5

    super().__init__(filename, *args, pagesize=page_size, initialFontSize=font_size)
    self.file_name = filename
    self.page_size = page_size
    self.font_size = font_size

    if vial is not None:
      self.load_vial(vial)

  @property
  def margin(self):
    return 4 * mm

  def load_vial(self, vial: Vial):
    sc = ServerConfiguration.get()
    self.rotate(90)

    cursor = Cursor(10, -10)

    cursor = self.draw_string(cursor, vial.lot_number)
    cursor = self.draw_string(cursor, f"{vial.activity} MBq")
    cursor = self.draw_string(cursor, f"{vial.fill_time.hour}:{vial.fill_time.minute}:{vial.fill_time.second}")
    cursor = self.draw_string(cursor, f"{vial.fill_date.day}/{vial.fill_date.month}/{vial.fill_date.year}")
    cursor = self.draw_string(cursor, f"Ved Uheld ring: {format_phone_number(sc.AdminPhoneNumber)}")

    self.save()

def get_label_post_script(filename:str, vial: Vial):
  drawing = Drawing(200,100)


  drawing.add(String(5,85, f"{vial.lot_number}", fontName="Mari"))
  drawing.add(String(5,75, f"{vial.activity} MBq", fontName="Mari"))
  drawing.add(String(5,65, f"{vial.fill_time.hour}:{vial.fill_time.minute}:{vial.fill_time.second}", fontName="Mari"))
  drawing.add(String(5,55, f"{vial.fill_date.day}/{vial.fill_date.month}/{vial.fill_date.year}", fontName="Mari"))

  drawing.add(Image(105, 5, 80, 80, str(radioactive_path)))

  with open(filename, 'wb') as fp:
    renderPS.drawToFile(drawing, fp)

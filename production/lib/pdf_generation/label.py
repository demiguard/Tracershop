# Python Standard library
from logging import getLogger
from pathlib import Path
from typing import IO, Optional



# Third part modules:
## Django
from django.conf import settings

## Report Lab
from reportlab.graphics.shapes import String, Drawing, Image
from reportlab.graphics import renderPS
from reportlab.lib.units import mm, inch

# Tracershop modules
from constants import DEBUG_LOGGER
from database.models import Vial, ServerConfiguration
from lib.formatting import format_phone_number, format_time_number
from lib.pdf_generation import Cursor, TracershopCanvas, defaultFont

radioactive_path = Path(f"{settings.BASE_DIR}/pdfData/radioactive.jpg")

debug_logger = getLogger(DEBUG_LOGGER)

class VialLabel(TracershopCanvas):
  def __init__(self, filename: str | IO[bytes], vial: Optional[Vial] = None, *args) -> None:
    page_size = (98 * mm, 38 * mm)
    font_size = 10

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

    hour = format_time_number(vial.fill_time.hour)
    minute = format_time_number(vial.fill_time.minute)
    second = format_time_number(vial.fill_time.second)

    day = format_time_number(vial.fill_date.day)
    month = format_time_number(vial.fill_date.month)
    year = str(vial.fill_date.year)

    image_size = 20 * mm

    self.drawImage(radioactive_path, 74 * mm , 38 * mm - image_size - self.margin, image_size, image_size)

    cursor = Cursor(self.margin, 26 * mm - self.font_size)

    self.draw_text_lines(
      cursor, [
        vial.lot_number,
        f"{vial.activity} MBq",
        f"{hour}:{minute}:{second}",
        f"{day}/{month}/{year}",
        f"Ved Uheld ring: {format_phone_number(sc.AdminPhoneNumber)}"
      ]
    )

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

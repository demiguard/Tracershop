"""This file is responsible for the rendering of PDF files.
  This relates to generation of delivery notes for tracers

Most of the functionality is found in:
  * DrawActivityOrder
  * DrawInjectionOrder
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from datetime import date, datetime
from pathlib import Path
from typing import Iterable, Optional, Tuple, List, Sequence

# Django packages
from django.conf import settings
from django.db.models import QuerySet
from django.utils import timezone

# Third party packages
from reportlab.pdfgen import canvas
import reportlab.rl_config
reportlab.rl_config.warnOnMissingFontGlyphs = 0 # type: ignore
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
try:
  pdfmetrics.registerFont(TTFont('Mari', 'pdfData/Mari.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Bold', 'pdfData/Mari_Bold.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Book', 'pdfData/Mari_Book.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Heavy', 'pdfData/Mari_Heavy.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Light', 'pdfData/Mari_Light.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Poster', 'pdfData/Mari_Poster.ttf'))
  fonts = True
except:
  fonts = False # pragma: no cover



# Tracershop Production packages
from constants import LEGACY_ENTRIES
from lib.Formatting import dateConverter, timeConverter, mapTracerUsage
from database.models import Customer, ActivityOrder, ActivityProduction, DeliveryEndpoint, InjectionOrder, ActivityDeliveryTimeSlot, Vial, TracerUsage

##### Constant declarations #####
#Lines are on the format (x1, y1, x2, y2)
TOP_LINE    = (50,50, 545, 50)
BOTTOM_LINE = (50, 791, 545, 791)

if fonts:
  defaultFont = "Mari_Light"
else:
  defaultFont = "Helvetica" # pragma no cover
defaultFontSize = 13

start_x_cursor = 58
start_y_cursor = 780

def order_pair(i,j):
  return (min(i,j), max(i,j))


class MailTemplate(canvas.Canvas):
  _line_height = 18 # How large is a text line
  _font       = defaultFont
  _font_size  = defaultFontSize
  _Length_per_character = 6.5
  _table_width = 450

  def __init__(self, filename: str):
    super().__init__(filename)

    self.setStrokeColorRGB(0.0,0.0,0.0)
    self.lines([
      TOP_LINE,
      BOTTOM_LINE
    ])

    self.drawInlineImage("pdfData/petlogo_small.png",  417, 750 , width= 128, height=32)

  def ApplyEndpoint(self, x_cursor:int, y_cursor:int, endpoint: DeliveryEndpoint) -> int:
    self.setStrokeColorRGB(0.5,0.5,1.0)
    self.setFont(self._font, self._font_size)

    customer = endpoint.owner

    y_top = y_cursor

    y_cursor -= 15 # Move the Cursor Down

    phone = ""
    email = ""

    if customer.billing_phone is not None:
      phone = customer.billing_phone

    if customer.billing_email is not None:
      email = customer.billing_email

    Customer_identification_lines = [customer.long_name,
                                     customer.billing_address,
                                     phone,
                                     email]
    max_text_length = 0


    for line in Customer_identification_lines:
      if line is None:
        line = ''
      self.drawString(x_cursor, y_cursor, line)
      y_cursor -= self._line_height
      max_text_length = max(max_text_length, len(line))

    Y_bot =  y_cursor + 10

    line_width = 3

    encapsulating_x_line_start = x_cursor - line_width
    encapsulating_x_line_stop = max(200, x_cursor + max_text_length * self._Length_per_character + line_width)

    encapsulating_top_line    = (encapsulating_x_line_start, y_top, encapsulating_x_line_stop, y_top)
    encapsulating_bot_line = (encapsulating_x_line_start, Y_bot, encapsulating_x_line_stop, Y_bot)


    self.lines([
      encapsulating_top_line,
      encapsulating_bot_line
    ])

    return y_cursor

  def ApplyOrderActivity(
      self,
      x_cursor: int,
      y_cursor: int,
      order_date: date,
      productions: Sequence[ActivityProduction],
      orders: Iterable[ActivityOrder],
    ) -> int:

    self.setFont(self._font, self._font_size)
    self.setStrokeColorRGB(0,0,0)

    pivotProduction = productions[0]
    tracer = pivotProduction.tracer

    self.drawString(x_cursor, y_cursor, f"Dato: {dateConverter(order_date, '%d/%m/%Y')}")
    y_cursor -= self._line_height
    self.drawString(x_cursor, y_cursor, f"Hermed frigives {tracer.clinical_name} - {tracer.isotope.atomic_letter}-{tracer.isotope.atomic_mass} til humant brug.")
    y_cursor -= 2 * self._line_height

    HeaderText = [
      "Order ID",
      "Bestilt",
      "Ønsket kl:",
      "Frigivet kl:",
    ]

    releaseTimes = []

    for order in orders:
      if order.freed_datetime is None:
        releaseTimes.append('')
      else:
        try:
          timezone_aware = timezone.make_naive(order.freed_datetime)
        except ValueError:
          timezone_aware = order.freed_datetime
        releaseTimes.append(timezone_aware.strftime("%H:%M:%S"))

    orderData = [[
      str(order.id),
      f"{order.ordered_activity} MBq",
      str(order.ordered_time_slot.delivery_time),
      releaseTime
    ] for (order, releaseTime) in zip(orders, releaseTimes)]

    table_content = [HeaderText] + orderData

    y_cursor = self.drawTable(x_cursor, y_cursor, self._table_width, table_content)
    y_cursor -= 25

    return y_cursor


  def applyVials(self, x_cursor:int, y_cursor : int, vials: Sequence[Vial]):
    """[summary]

    Args:
        x_cursor (int): The Cursor
        y_cursor (int): [description]
        Vials (List[VialDataClass]): [description]
    Returns:
        int - end position of the y cursor
    """
    tableHeader = [
      "Batch nummer",
      "Kalibrering",
      "Aktivitet",
      "Volume"
    ]

    tableData = [
      [str(vial.lot_number),
       timeConverter(vial.fill_time),
       str(round(vial.activity)),
       str(round(vial.volume, 2))
       ] for vial in vials
    ]

    tableContent = [tableHeader] + tableData

    if len(vials):
      y_cursor = self.drawTable(x_cursor, y_cursor, self._table_width, tableContent)
    else:
      self.drawString(x_cursor, y_cursor, "Der er ingen vials")
      y_cursor -= self._line_height

    return y_cursor


  def _drawBox(self, t4: Tuple[int,int,int,int]):
    """Overloaded function of draw box.

    Args:
        t4 (Tuple[int,int,int,int]): _description_

    Returns:
        _type_: _description_
    """
    x_1,y_1,x_2,y_2 = t4  #pragma: no cover
    return self.drawBox(x_1, y_1, x_2, y_2) # pragma: no cover

  def drawBox(self, x_1 :int, y_1:int, x_2:int, y_2:int):
    """Draw a box on the canvas
      A box is defined as:
        (x1, y1) --------- (x2,y1)
            |                 |
            |                 |
            |                 |
            |                 |
        (x1, y2) --------- (x2,y2)

      Note that a box is defined by just two corner points
      ALSO LOOK MAH DRAWING MY DRAWING IS AMAZING
      GIVE IT A LICK, IT TASTE JUST LIKE RASINS
    Args:
        x_1 (int): [description]
        y_1 (int): [description]
        x_2 (int): [description]
        y_2 (int): [description]
    """
    x_start, x_end = order_pair(x_1, x_2)
    y_start, y_end = order_pair(y_1, y_2)

    box_top_line = (x_start, y_start, x_end, y_start)
    box_lef_line = (x_start, y_start, x_start, y_end)
    box_bot_line = (x_start, y_end, x_end, y_end)
    box_rig_line = (x_end, y_start, x_end, y_end)

    self.lines([
      box_top_line,
      box_lef_line,
      box_rig_line,
      box_bot_line
    ])

  def drawTableTextLine(
    self,
    line_x_start,
    line_y,
    line_length,
    Texts : List[str],
    font : str = defaultFont,
    font_size : int = defaultFontSize,
    separator_lines : bool = True
  ):
    """[summary]

    Args:
        line_x_start ([type]): [description]
        line_y ([type]): [description]
        line_length ([type]): [description]
        Texts (List[str]): [description]
        font (str, optional): [description]. Defaults to defaultFont.
        font_size (int, optional): [description]. Defaults to defaultFontSize.
        separator_lines (bool, optional): [description]. Defaults to True.
    """
    self.setFont(font, font_size)

    x = line_x_start + 5

    for i, text in enumerate(Texts):
      self.drawString(x, line_y + 2 , text)
      x += line_length / len(Texts)
      if separator_lines and i != len(Texts) -1:
        self.line(x - 5, line_y + self._line_height, x - 5, line_y )

  def drawTable(self, x_cursor: int, y_cursor: int, table_width: int, textLines: List[List[str]]):
    """[summary]

    Args:
        x_cursor (int): [description]
        y_cursor (int): [description]
        table_width (int): [description]
        textLines (List[List[str]]): [description]

    Returns:
        [type]: [description]
    """
    for TableTextLine in textLines:
      self.drawBox(
          x_cursor,
          y_cursor,
          x_cursor + table_width,
          y_cursor + self._line_height
        )
      self.drawTableTextLine(x_cursor, y_cursor, table_width, TableTextLine)
      y_cursor -= self._line_height

    return y_cursor

  def ApplyInjectionOrder(
      self,
      x_cursor : int,
      y_cursor : int,
      injectionOrder : InjectionOrder,
      ) -> int:

    if(injectionOrder.delivery_date < LEGACY_ENTRIES):
      self.drawString(x_cursor, y_cursor, "Ordren er lavet i det gamle tracershop, og kan derfor manglel data")
      y_cursor -= self._line_height


    tracer = injectionOrder.tracer
    isotope = tracer.isotope

    self.drawString(x_cursor, y_cursor, f"Hermed frigives Orderen {injectionOrder.id} - {tracer.clinical_name} - {isotope.atomic_letter}-{isotope.atomic_mass} Injektion til {mapTracerUsage(TracerUsage(injectionOrder.tracer_usage))} brug.")
    y_cursor -= self._line_height

    if injectionOrder.freed_datetime is None:
      freedDatetime = "Ukendt frigivelse tidspunkt"
    else:
      freedDatetime = injectionOrder.freed_datetime.strftime("%d/%m/%Y %H:%M")

    self.drawString(x_cursor, y_cursor, f"{freedDatetime} er der frigivet {injectionOrder.injections} injektioner med batch nummer: {injectionOrder.lot_number}")


    y_cursor -= self._line_height * 2

    return y_cursor


  def ApplySender(self, x_cursor, y_cursor):
    self.drawString(x_cursor, y_cursor, f"Venlig Hilsen")

    x_cursor += 15
    y_cursor -= self._line_height

    self.drawString(x_cursor, y_cursor, "Nic Gillings")

    y_cursor -= self._line_height * 8.2

    self.drawInlineImage("pdfData/sig.png", x_cursor + 30, y_cursor, 128, 109, preserveAspectRatio=True)

    y_cursor -= self._line_height * 2

    self.drawString(x_cursor, y_cursor, f"PET & Cyklotronenheden UK 3982")
    y_cursor -= self._line_height

    self.drawString(x_cursor, y_cursor, f"Rigshospitalet")
    y_cursor -= self._line_height

    self.drawString(x_cursor, y_cursor, f"Blegdamsvej 9")
    y_cursor -= self._line_height

    self.drawString(x_cursor, y_cursor, f"2100 København Ø")
    y_cursor -= self._line_height * 2

    self.drawString(x_cursor, y_cursor, f"Tlf: +45 35453949")
    y_cursor -= self._line_height

    return y_cursor


def DrawActivityOrder(
    filename: str,
    order_date: date,
    endpoint: DeliveryEndpoint,
    productions : Sequence[ActivityProduction],
    orders: Iterable[ActivityOrder] ,
    vials: Sequence[Vial],
  ) -> None:



  template = MailTemplate(filename)
  x_cursor = start_x_cursor
  y_cursor = start_y_cursor

  y_cursor = template.ApplyEndpoint(x_cursor, y_cursor, endpoint)

  x_cursor += 10
  y_cursor -= 20

  y_cursor = template.ApplyOrderActivity(x_cursor, y_cursor, order_date, productions, orders)
  y_cursor -= 10

  if LEGACY_ENTRIES < order_date :
    template.drawString(x_cursor, y_cursor, 'Orderen er lavet i det gamle system.\
 Derfor kan orderen være ufuldstændig.')
    y_cursor -= template._line_height * 2
  if len(vials) != 0:
    y_cursor = template.applyVials(x_cursor, y_cursor, vials)

  y_cursor -= 10
  y_cursor = template.ApplySender(x_cursor, y_cursor)

  template.save()

def DrawInjectionOrder(
    filename: str,
    injectionOrder : InjectionOrder,
  ):
  template = MailTemplate(filename)
  x_cursor = start_x_cursor
  y_cursor = start_y_cursor

  endpoint = injectionOrder.endpoint

  y_cursor = template.ApplyEndpoint(x_cursor, y_cursor, endpoint)

  x_cursor += 10
  y_cursor -= 20

  y_cursor = template.ApplyInjectionOrder(x_cursor, y_cursor, injectionOrder)

  y_cursor = template.ApplySender(x_cursor, y_cursor)

  template.save()

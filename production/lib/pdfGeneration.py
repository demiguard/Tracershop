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
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import reportlab.rl_config
reportlab.rl_config.warnOnMissingFontGlyphs = 0 # type: ignore
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
try: #pragma: no cover
  pdfmetrics.registerFont(TTFont('Mari',        f'{settings.BASE_DIR}/pdfData/Mari.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Bold',   f'{settings.BASE_DIR}/pdfData/Mari_Bold.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Book',   f'{settings.BASE_DIR}/pdfData/Mari_Book.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Heavy',  f'{settings.BASE_DIR}/pdfData/Mari_Heavy.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Light',  f'{settings.BASE_DIR}/pdfData/Mari_Light.ttf'))
  pdfmetrics.registerFont(TTFont('Mari_Poster', f'{settings.BASE_DIR}/pdfData/Mari_Poster.ttf'))
  fonts = True
except:
  fonts = False # pragma: no cover

WIDTH, HEIGHT = A4

# Tracershop Production packages
from constants import LEGACY_ENTRIES
from lib.formatting import dateConverter, timeConverter, mapTracerUsage,\
  toDanishDecimalString, empty_none_formatter
from database.models import Customer, ActivityOrder, ActivityProduction, DeliveryEndpoint, InjectionOrder, ActivityDeliveryTimeSlot, Vial, TracerUsage



##### Constant declarations #####
#Lines are on the format (x1, y1, x2, y2)
TOP_LINE    = (50,50, 545, 50)
BOTTOM_LINE = (50, 791, 545, 791)

if fonts: #pragma: no cover
  defaultFont = "Mari_Light"
else:
  defaultFont = "Helvetica" # pragma no cover
defaultFontSize = 13


LINE_WIDTH = 500

start_x_cursor = (WIDTH - 500) / 2
start_y_cursor = 780



def order_pair(i,j):
  return (min(i,j), max(i,j))


MonthNames = {
  1  : "Januar",
  2  : "Februar",
  3  : "Marts",
  4  : "April",
  5  : "Maj",
  6  : "Juni",
  7  : "Juli",
  8  : "August",
  9  : "September",
  10 : "Oktober",
  11 : "November",
  12 : "December",
}


class MailTemplate(canvas.Canvas):
  line_height = 18 # How large is a text line
  _font       = defaultFont
  _font_size  = defaultFontSize
  _Length_per_character = 6.5
  _table_width = 450

  def __init__(self, filename: str, now: Optional[datetime]=None):
    super().__init__(filename)
    icon_ordinate = 780
    icon_height = 48
    self.setLineWidth(0.5)
    self.setStrokeColorRGB(0.0,0.0,0.0)
    self.drawInlineImage(f"{settings.BASE_DIR}/pdfData/Logo_Rigshospitalet_Hospital_RGB.jpg",
                         start_x_cursor,
                         icon_ordinate,
                         width=128,
                         height=icon_height,
                         preserveAspectRatio=True)
    #if now == None:
    #  now = datetime.now()

    #today_string = f"{now.day}-{MonthNames[now.month]}-{now.year}"

    #today_text_length = self.stringWidth(today_string,
    #                                     self._font,
    #                                     self._font_size)

    #date_abscissa = WIDTH - start_x_cursor - today_text_length
    #date_ordinate = icon_ordinate + (icon_height - self._font_size) / 2

    #self.drawString(date_abscissa, date_ordinate, today_string)

  def resetFont(self):
    self.setFont(self._font, self._font_size)

  def drawBoldString(self,
                     abscissa,
                     ordinate,
                     string_to_bold,
                     bold_font_size=defaultFontSize):
    """Adds a string which is bold

    Args:
        abscissa (int): Also named x, in none Mathematical circles
        ordinate (int): Also named x, in none Mathematical circles
        string_to_bold (str): Str to be written in bold
    """
    if fonts: #pragma: no cover
      self.setFont('Mari_Bold', bold_font_size)
    else:
      self.setFont('Helvetica', bold_font_size)
    self.drawString(abscissa, ordinate, string_to_bold)
    self.resetFont()

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
      y_cursor -= self.line_height
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
    y_cursor -= self.line_height
    self.drawString(x_cursor, y_cursor, f"Hermed frigives {tracer.clinical_name} - {tracer.isotope.atomic_letter}-{tracer.isotope.atomic_mass} til humant brug.")
    y_cursor -= 2 * self.line_height

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
      y_cursor -= self.line_height

    return y_cursor


  def p_drawBox(self, t1: Tuple[int, int], t2: Tuple[int, int]):
    x_1, y_1 = t1
    x_2, y_2 = t2
    return self.drawBox(x_1, y_1, x_2, y_2)

  def t_drawBox(self, t4: Tuple[int,int,int,int]):
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
        self.line(x - 5, line_y + self.line_height, x - 5, line_y )

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
          y_cursor + self.line_height
        )
      self.drawTableTextLine(x_cursor, y_cursor, table_width, TableTextLine)
      y_cursor -= self.line_height

    return y_cursor

  def ApplyInjectionOrder(
      self,
      x_cursor : int,
      y_cursor : int,
      injectionOrder : InjectionOrder,
      ) -> int:

    if(injectionOrder.delivery_date < LEGACY_ENTRIES):
      self.drawString(x_cursor, y_cursor, "Ordren er lavet i det gamle tracershop, og kan derfor manglel data")
      y_cursor -= self.line_height


    tracer = injectionOrder.tracer
    isotope = tracer.isotope

    self.drawString(x_cursor, y_cursor, f"Hermed frigives Orderen {injectionOrder.id} - {tracer.clinical_name} - {isotope.atomic_letter}-{isotope.atomic_mass} Injektion til {mapTracerUsage(TracerUsage(injectionOrder.tracer_usage))} brug.")
    y_cursor -= self.line_height

    if injectionOrder.freed_datetime is None:
      freedDatetime = "Ukendt frigivelse tidspunkt"
    else:
      freedDatetime = injectionOrder.freed_datetime.strftime("%d/%m/%Y %H:%M")

    self.drawString(x_cursor, y_cursor, f"{freedDatetime} er der frigivet {injectionOrder.injections} injektioner med batch nummer: {injectionOrder.lot_number}")


    y_cursor -= self.line_height * 2

    return y_cursor


  def ApplySender(self, x_cursor, y_cursor):
    self.drawString(x_cursor, y_cursor, f"Venlig Hilsen")

    x_cursor += 15
    y_cursor -= self.line_height

    self.drawString(x_cursor, y_cursor, "Nic Gillings")

    y_cursor -= self.line_height * 8.2

    self.drawInlineImage(f"{settings.BASE_DIR}/pdfData/sig.png", x_cursor + 30, y_cursor, 128, 109, preserveAspectRatio=True)

    y_cursor -= self.line_height * 2

    self.drawString(x_cursor, y_cursor, f"PET & Cyklotronenheden UK 3982")
    y_cursor -= self.line_height

    self.drawString(x_cursor, y_cursor, f"Rigshospitalet")
    y_cursor -= self.line_height

    self.drawString(x_cursor, y_cursor, f"Blegdamsvej 9")
    y_cursor -= self.line_height

    self.drawString(x_cursor, y_cursor, f"2100 København Ø")
    y_cursor -= self.line_height * 2

    self.drawString(x_cursor, y_cursor, f"Tlf: +45 35453949")
    y_cursor -= self.line_height

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
    y_cursor -= template.line_height * 2
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

def DrawTransportDocument(filename, customer):
  pass


def DrawDeliveryNote(filename):
  pass


def DrawReleaseCertificate(filename :str,
                           order_date : date,
                           endpoint : DeliveryEndpoint,
                           productions : Sequence[ActivityProduction],
                           orders : Sequence[ActivityOrder] ,
                           vials : Sequence[Vial],):
  template = MailTemplate(filename)
  x_cursor = start_x_cursor
  y_cursor = 400

  customer = endpoint.owner

  formatted_date = order_date.strftime("%d:%m:%Y")
  pivot_production = productions[0]
  if len(vials):
    pivot_vial = vials[0]
  else:
    pivot_order = orders[0]
    if pivot_order.freed_datetime is None:
      fill_time = pivot_order.active_time_slot.delivery_time
      fill_date = pivot_order.delivery_date
    else:
      fill_time = pivot_order.freed_datetime.time()
      fill_date = pivot_order.freed_datetime.date()

    pivot_vial = Vial(
      fill_date = fill_date,
      fill_time = fill_time,
      lot_number = "Ukendt batch nummer"
    )



  production_datetime = datetime(pivot_vial.fill_date.year,
                                 pivot_vial.fill_date.month,
                                 pivot_vial.fill_date.day,
                                 pivot_vial.fill_time.hour,
                                 pivot_vial.fill_time.minute,
                                 pivot_vial.fill_time.second)

  production_date_string = production_datetime.strftime("%d/%m-%Y")

  # this should be a function
  title = "FRIGIVELSESCERTIFIKAT"
  if fonts: #pragma: no cover
    bold_font = 'Mari_Bold'
  else:
    bold_font = 'Helvetica'

  title_width = template.stringWidth(title, bold_font, 22)

  title_abscissa = ((WIDTH) - title_width) / 2
  template.drawBoldString(title_abscissa, 750, title, bold_font_size=22)

  table_row_y_top_1 = 730
  table_row_y_top_2 = table_row_y_top_1 - template.line_height * 1.5
  table_row_y_top_3 = table_row_y_top_1 - template.line_height * 3.0
  table_row_y_top_4 = table_row_y_top_1 - template.line_height * 4.5
  table_row_y_top_5 = table_row_y_top_1 - template.line_height * 6
  table_row_y_top_bottom = table_row_y_top_1 - template.line_height * 11.5


  # First line of the first table
  box_abscissa_start = start_x_cursor
  box_abscissa_end = WIDTH - start_x_cursor
  box_abscissa_middle_1 = (box_abscissa_end - box_abscissa_start) * 0.4
  box_abscissa_middle_2 = (box_abscissa_end - box_abscissa_start) * 0.5
  # Box 1
  template.p_drawBox((box_abscissa_start,    table_row_y_top_1),
                     (box_abscissa_middle_1, table_row_y_top_1 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_1, table_row_y_top_1),
                     (box_abscissa_middle_2, table_row_y_top_1 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_2, table_row_y_top_1),
                     (box_abscissa_end,      table_row_y_top_1 - template.line_height * 1.5))
  # Box 2
  template.p_drawBox((box_abscissa_start,    table_row_y_top_2),
                     (box_abscissa_middle_1, table_row_y_top_2 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_1, table_row_y_top_2),
                     (box_abscissa_middle_2, table_row_y_top_2 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_2, table_row_y_top_2),
                     (box_abscissa_end,      table_row_y_top_2 - template.line_height * 1.5))
  # Box 3
  template.p_drawBox((box_abscissa_start,    table_row_y_top_3),
                     (box_abscissa_middle_1, table_row_y_top_3 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_1, table_row_y_top_3),
                     (box_abscissa_middle_2, table_row_y_top_3 - template.line_height * 1.5))
  template.p_drawBox((box_abscissa_middle_2, table_row_y_top_3),
                     (box_abscissa_end,      table_row_y_top_3 - template.line_height * 1.5))
  # Box 4
  template.p_drawBox((box_abscissa_start,    table_row_y_top_4),
                     (box_abscissa_middle_1, table_row_y_top_5))
  template.p_drawBox((box_abscissa_middle_1, table_row_y_top_4),
                     (box_abscissa_middle_2, table_row_y_top_5))
  template.p_drawBox((box_abscissa_middle_2, table_row_y_top_4),
                     (box_abscissa_end,      table_row_y_top_5))
  # Box 5
  template.p_drawBox((box_abscissa_start,    table_row_y_top_5),
                     (box_abscissa_middle_1, table_row_y_top_bottom))
  template.p_drawBox((box_abscissa_middle_1, table_row_y_top_5),
                     (box_abscissa_middle_2, table_row_y_top_bottom))
  template.p_drawBox((box_abscissa_middle_2, table_row_y_top_5),
                     (box_abscissa_end,      table_row_y_top_bottom))

  header_box_text_start = box_abscissa_start + 5

  template.drawBoldString(header_box_text_start, table_row_y_top_1 - template.line_height, "Modtager")
  template.drawBoldString(header_box_text_start, table_row_y_top_2 - template.line_height, "Produktnavn")
  template.drawBoldString(header_box_text_start, table_row_y_top_3 - template.line_height, "Batchnummer")
  template.drawBoldString(header_box_text_start, table_row_y_top_4 - template.line_height, "Fremstillingsdato")
  template.drawBoldString(header_box_text_start, table_row_y_top_5 - template.line_height, "Fremstiller")

  long_name = empty_none_formatter(customer.long_name)
  clinical_name = empty_none_formatter(pivot_production.tracer.clinical_name)

  header_box_text_info_start = box_abscissa_middle_2 + 5
  template.drawString(header_box_text_info_start,
                      table_row_y_top_1 - (template.line_height),
                      long_name)

  template.drawString(header_box_text_info_start,
                      table_row_y_top_2 - (template.line_height),
                      clinical_name)
  template.drawString(header_box_text_info_start,
                      table_row_y_top_3 - (template.line_height),
                      pivot_vial.lot_number)
  template.drawString(header_box_text_info_start,
                      table_row_y_top_4 - (template.line_height),
                      production_date_string)
  # Line 1
  template.drawString(header_box_text_info_start,
                      table_row_y_top_5 - (template.line_height),
                      "Cyklotron og Radiokemi, enhed 3982")
  template.drawString(header_box_text_info_start,
                      table_row_y_top_5 - (2 * template.line_height),
                      "Afdeling for Klinisk Fysiologi og Nuklear Medicin")
  template.drawString(header_box_text_info_start,
                      table_row_y_top_5 - (3 * template.line_height),
                      "Rigshospitalet")
  template.drawString(header_box_text_info_start,
                      table_row_y_top_5 - (4 * template.line_height),
                      "Blegdamsvej 9")
  template.drawString(header_box_text_info_start,
                      table_row_y_top_5 - (5 * template.line_height),
                      "2100 København Ø")

  # Table 2 Header
  t2_abscissa_m1 = (box_abscissa_end - box_abscissa_start) * 0.125 + box_abscissa_start
  t2_abscissa_m2 = (box_abscissa_end - box_abscissa_start) * 0.325 + box_abscissa_start
  t2_abscissa_m3 = (box_abscissa_end - box_abscissa_start) * 0.48 + box_abscissa_start
  t2_abscissa_m4 = (box_abscissa_end - box_abscissa_start) * 0.65 + box_abscissa_start
  t2_abscissa_m5 = (box_abscissa_end - box_abscissa_start) * 0.775 + box_abscissa_start

  def draw_table_2_row(ordinate, texts: Tuple[str, str, str, str,str, str], bold=False):
    template.p_drawBox((box_abscissa_start, ordinate),
                       (t2_abscissa_m1, ordinate - template.line_height * 1.5))
    template.p_drawBox((t2_abscissa_m1, ordinate),
                       (t2_abscissa_m2, ordinate - template.line_height * 1.5))
    template.p_drawBox((t2_abscissa_m2, ordinate),
                       (t2_abscissa_m3, ordinate - template.line_height * 1.5))
    template.p_drawBox((t2_abscissa_m3, ordinate),
                       (t2_abscissa_m4, ordinate - template.line_height * 1.5))
    template.p_drawBox((t2_abscissa_m4, ordinate),
                       (t2_abscissa_m5, ordinate - template.line_height * 1.5))
    template.p_drawBox((t2_abscissa_m5, ordinate),
                       (box_abscissa_end, ordinate - template.line_height * 1.5))


    t1,t2,t3,t4,t5, t6 = texts
    if bold:
      template.drawBoldString(box_abscissa_start + 5, ordinate - template.line_height, t1)
      template.drawBoldString(t2_abscissa_m1 + 5, ordinate - template.line_height, t2)
      template.drawBoldString(t2_abscissa_m2 + 5, ordinate - template.line_height, t3)
      template.drawBoldString(t2_abscissa_m3 + 5, ordinate - template.line_height, t4)
      template.drawBoldString(t2_abscissa_m4 + 5, ordinate - template.line_height, t5)
      template.drawBoldString(t2_abscissa_m5 + 5, ordinate - template.line_height, t6)
    else:
      template.drawString(box_abscissa_start + 5, ordinate - template.line_height, t1)
      template.drawString(t2_abscissa_m1 + 5, ordinate - template.line_height, t2)
      template.drawString(t2_abscissa_m2 + 5, ordinate - template.line_height, t3)
      template.drawString(t2_abscissa_m3 + 5, ordinate - template.line_height, t4)
      template.drawString(t2_abscissa_m4 + 5, ordinate - template.line_height, t5)
      template.drawString(t2_abscissa_m5 + 5, ordinate - template.line_height, t6)



  draw_table_2_row(table_row_y_top_bottom,
                   ("Ordre ID",
                    "Bestilt",
                    "Kalibreret kl",
                    "Leveret",
                    "Volumen",
                    "Frigivet kl"),
                   True)
  ordinate = table_row_y_top_bottom - template.line_height * 1.5
  max_rows = max(len(orders), len(vials))
  for i in range(max_rows):
    if i < len(orders):
      order = orders[i]
      order_id = str(order.id)
      ordered_activity = f"{toDanishDecimalString(order.ordered_activity, 0)} MBq"
      try:
        timezone_aware = timezone.make_naive(order.freed_datetime)
      except ValueError:
        timezone_aware = order.freed_datetime
      except AttributeError:
        timezone_aware = order.freed_datetime

      if timezone_aware is not None:
        freed = timezone_aware.strftime('%H:%M %d/%m/%Y')
      else:
        freed = "Ukendt tidspunkt"
    else:
      order_id = ""
      ordered_activity = ""
      freed = ""

    if i < len(vials):
      vial = vials[i]
      calibration_time = f"{vial.fill_time.isoformat('minutes')}"
      vial_activity = f"{toDanishDecimalString(vial.activity, 0)} MBq"
      volume = f"{toDanishDecimalString(vial.volume)} ml"
    else:
      calibration_time = ""
      vial_activity = ""
      volume = ""

    draw_table_2_row(ordinate, (order_id, ordered_activity, calibration_time, vial_activity, volume, freed))
    ordinate -= template.line_height * 1.5

  ordinate -= template.line_height * 3

  template.drawString(x_cursor, ordinate, "Det attesteres hermed, at produktet er fremstillet, analyseret og pakket på ovennævnte")
  ordinate -= template.line_height
  if(pivot_production.tracer.marketed):
    template.drawString(x_cursor, ordinate, "site i fuld overensstemmelse med kravene til GMP og gældende markedsføringstilladelse.")
  else:
    template.drawString(x_cursor, ordinate, "site i fuld overensstemmelse med kravene til GMP.")

  ordinate -= template.line_height * 1.5

  template.drawString(x_cursor, ordinate, "Hermed frigives produktet til humant brug.")
  ordinate -= template.line_height * 2.5
  template.drawString(x_cursor, ordinate, "QP navn: Nic Gillings")
  ordinate -= template.line_height * 2.5
  template.drawString(x_cursor, ordinate, f"Dato: {production_date_string}")
  ordinate -= template.line_height * 1.5
  template.drawString(x_cursor, ordinate, f"Underskrift:")
  ordinate -= template.line_height * 1.5
  sig_height = 109

  template.drawInlineImage(f"{settings.BASE_DIR}/pdfData/sig.png", x_cursor + 30, ordinate - sig_height, 128, sig_height, preserveAspectRatio=True)
  template.save()

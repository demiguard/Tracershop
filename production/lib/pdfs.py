from django.conf import settings

import os
from pathlib import Path


from lib.decorators import typeCheckfunc
from lib.SQL import SQLController
from lib.ProductionDataClasses import CustomerDataClass, ActivityOrderDataClass, InjectionOrderDataClass, IsotopeDataClass, TracerDataClass, VialDataClass
from typing import Optional, Tuple, List
from reportlab.pdfgen import canvas
from PIL import Image

"""
  This file is responsible for the rendering of PDF files.
  Note that Python is not reaaaaaly a good rendering program for these kind of tasks
  However it's one of those No win situations, since the other solution to this 
  was to generate a Latex file and then compile it.

  Most of this file is drawings of different primitives such as lines
"""


#A pdf page is (595.27 , 841.89)

#Lines are on the format (x1, y1, x2, y2)
TOP_LINE    = (50,50, 545, 50)
BOTTOM_LINE = (50, 791, 545, 791)

defaultFont = "Helvetica"
defaultFontSize = 11

def order_pair(i,j):
  return (min(i,j), max(i,j))

class MailTemplate(canvas.Canvas):
  __line_width = 15 # How large is a text line
  __font       = defaultFont
  __font_size  = defaultFontSize
  __Length_per_character = 6.5
  __table_width = 450

  def __init__(self, filename: str):
    super().__init__(filename)

    self.setStrokeColorRGB(0.0,0.0,0.0)
    self.lines([
      TOP_LINE,
      BOTTOM_LINE
    ])
    self.drawInlineImage("petlogo_small.png",  417, 750 , width= 128, height=32)

  def ApplyCustomer(self, x_cursor:int, y_cursor:int, Customer: CustomerDataClass):
    self.setStrokeColorRGB(0.5,0.5,1.0)
    self.setFont(self.__font, self.__font_size)

    y_top = y_cursor

    y_cursor -= 15 # Move the Cursor Down

    Customer_identification_lines = [Customer.Realname, Customer.contact,str(Customer.tlf), Customer.email]
    max_text_length = 0


    for line in Customer_identification_lines:
      self.drawString(x_cursor, y_cursor, line)
      y_cursor -= self.__line_width
      max_text_length = max(max_text_length, len(line))

    Y_bot =  y_cursor + 10

    line_width = 3

    encapsulating_x_line_start = x_cursor - line_width
    encapsulating_x_line_stop = max(200, x_cursor + max_text_length * self.__Length_per_character + line_width)

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
      Order: ActivityOrderDataClass,
      COID_ORDER : Optional[ActivityOrderDataClass] = None,
      VialOrders : Optional[List[ActivityOrderDataClass]] = None
    ):
  
    #Helper Funcions
    def ExtractOrderData(Order : ActivityOrderDataClass):
      freeDateTimestr = "Fejl i database"
      if Order.frigivet_datetime != None:
        freeDateTimestr = Order.frigivet_datetime.strftime("%H:%M")

      return  [
        str(Order.oid),
        str(Order.amount),
        str(Order.frigivet_amount),
        str(Order.deliver_datetime.strftime("%H:%M")),
        str(freeDateTimestr)
      ]

    #End helper function

    self.setFont(self.__font, self.__font_size)
    self.setStrokeColorRGB(0.0,0.0,0.0)
    
    #Text 
    if COID_ORDER:
      self.drawString(x_cursor, y_cursor, f"Orderen {Order.oid} er Frigivet, den indeholder også Sporestof til Order {COID_ORDER.oid}")
    else:
      self.drawString(x_cursor, y_cursor, f"Orderen {Order.oid} er Frigivet.")
    y_cursor -= self.__line_width *2
    
    # Table 
    HeaderText = [
      "Order ID",
      "Bestilt",
      "Udleveret",
      "Ønsket kl:",
      "Frigivet kl:",
    ]

    OrderData = ExtractOrderData(Order)

    lines = [HeaderText, OrderData]
    
    if COID_ORDER:
      CoidData = ExtractOrderData(COID_ORDER)
      lines.append(CoidData)

    if VialOrders != None:
      for VialOrder in VialOrders:
        VialData = ExtractOrderData(VialOrder)
        lines.append(VialData)

    
    y_cursor = self.drawTable(x_cursor, y_cursor, self.__table_width, lines)
    y_cursor -= 5

    return y_cursor

  @typeCheckfunc
  def applyVials(self, x_cursor:int, y_cursor : int, Vials: List[VialDataClass]):
    """[summary]

    Args:
        x_cursor (int): The Cursor 
        y_cursor (int): [description]
        Vials (List[VialDataClass]): [description]
    Returns:
        int - end position of the y cursor
    """
    def ExtractVial(Vial: VialDataClass):
      return [
        str(Vial.charge),
        Vial.filltime.strftime("%H:%M"),
        str(int(Vial.activity)) + " MBq",
        str(Vial.volume) + " ml"
      ]

    #self.drawString(x_cursor, y_cursor, "Til ovenstående order tilhører føglende vials:")

    #y_cursor -= self.__line_width * 2

    lines = [
      [ "Batch nummer",
        "Kalibrering",
        "Aktivitet",
        "volume"
      ]
    ]
    for Vial in Vials:
      lines.append(ExtractVial(Vial))
    
    y_cursor = self.drawTable(x_cursor, y_cursor, self.__table_width, lines)

    return y_cursor


  def drawBox(self, t4: Tuple[int,int,int,int]):
    x_1,y_1,x_2,y_2 = t4
    return self.drawBox(x_1, y_1, x_2, y_2)

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
    seperator_lines : bool = True
  ):
    """[summary]

    Args:
        line_x_start ([type]): [description]
        line_y ([type]): [description]
        line_length ([type]): [description]
        Texts (List[str]): [description]
        font (str, optional): [description]. Defaults to defaultFont.
        font_size (int, optional): [description]. Defaults to defaultFontSize.
        seperator_lines (bool, optional): [description]. Defaults to True.
    """
    self.setFont(font, font_size)

    x = line_x_start + 5

    for i, text in enumerate(Texts):
      self.drawString(x, line_y + 2 , text)
      x += line_length / len(Texts)
      if seperator_lines and i != len(Texts) -1:
        self.line(x - 5, line_y + self.__line_width, x - 5, line_y )

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
          y_cursor + self.__line_width
        )
      self.drawTableTextLine(x_cursor, y_cursor, table_width, TableTextLine)
      y_cursor -= self.__line_width

    return y_cursor

  def ApplyOrderActivitySimple(
      self,
      x_cursor : int,
      y_cursor : int,
      Order: ActivityOrderDataClass,
      Vials: List[VialDataClass],
      Tracer : TracerDataClass,
      Isotope : IsotopeDataClass
    ):
    AssocVial = None
    for vial in Vials:
      if vial.order_id == Order.oid:
        AssocVial = vial
        break

    if AssocVial == None:
      raise ValueError("Vial matching order was not found")

    self.drawString(x_cursor, y_cursor, f"Ordrenr.: {Order.oid}")
    y_cursor -= self.__line_width

    freedate = Order.frigivet_datetime.strftime("%d.%m.%Y")

    self.drawString(x_cursor, y_cursor, f"Dato.: {freedate}")
    y_cursor -= self.__line_width

    self.drawString(x_cursor, y_cursor, f"Hermed frigives {Tracer.longName} - {Isotope.name} injektion til humant brug. Se Vial for batch Nr:")

    return y_cursor

  def ApplySender(self, x_cursor, y_cursor):
    self.drawString(x_cursor, y_cursor, f"Venlig Hilsen")

    x_cursor += 5
    y_cursor -= self.__line_width * 2

    self.drawString(x_cursor, y_cursor, f"PET & Cyklotronenheden UK 3982")
    y_cursor -= self.__line_width

    self.drawString(x_cursor, y_cursor, f"Rigshospitalet")
    y_cursor -= self.__line_width

    self.drawString(x_cursor, y_cursor, f"Blegdamsvej 9")
    y_cursor -= self.__line_width

    self.drawString(x_cursor, y_cursor, f"2100 København Ø")
    y_cursor -= self.__line_width * 2

    self.drawString(x_cursor, y_cursor, f"Tlf: +45 35453949")
    y_cursor -= self.__line_width

    return y_cursor

  def ApplyText(self, x_cursor:int, y_cursor : int, Tracer : TracerDataClass, Isotope : IsotopeDataClass):

    self.drawString(x_cursor, y_cursor, f"Hermed frigives {Tracer.longName} - {Isotope.name} injektion til humant brug. Se Vial for batch Nr")

    y_cursor -= self.__line_width

    return y_cursor


def DrawSimpleActivityOrder(filename :str,
    customer: CustomerDataClass,
    Order: ActivityOrderDataClass,
    Vials: List[VialDataClass],
    Tracer : TracerDataClass,
    Isotope : IsotopeDataClass
  ):
  template  = MailTemplate(filename)

  x_cursor = 58
  y_cursor = 780

  y_cursor = template.ApplyCustomer(x_cursor, y_cursor, customer)

  x_cursor += 10
  y_cursor -= 20

  y_cursor = template.ApplyOrderActivitySimple(x_cursor, y_cursor, Order, Vials, Tracer, Isotope)

  y_cursor -= 50

  y_cursor = template.applyVials(x_cursor, y_cursor, Vials)

  y_cursor -= 50

  y_cursor = template.ApplySender(x_cursor, y_cursor)

  template.save()


def DrawActivityOrder(
    filename: str,
    customer: CustomerDataClass,
    Order: ActivityOrderDataClass,
    vials: List[VialDataClass],
    COID_ORDER: Optional[ActivityOrderDataClass] = None,
    VialOrders: Optional[List[ActivityOrderDataClass]] = None
  ):
  template = MailTemplate(filename)

  x_cursor = 58
  y_cursor = 780

  y_cursor = template.ApplyCustomer(x_cursor, y_cursor, customer)

  x_cursor += 10
  y_cursor -= 20

  y_cursor = template.ApplyOrderActivity(x_cursor, y_cursor, Order, COID_ORDER=COID_ORDER, VialOrders=VialOrders)

  y_cursor -= 10

  y_cursor -= template.applyVials(x_cursor, y_cursor, vials)

  template.save()

def getPdfFilePath(customer: CustomerDataClass, Order: ActivityOrderDataClass):
  year = Order.deliver_datetime.strftime("%Y")
  month = Order.deliver_datetime.strftime("%m")

  pdfsPath  = Path(f"{settings.BASE_DIR}/frontend/static/frontend/pdfs")
  customerPath = Path(f"{settings.BASE_DIR}/frontend/static/frontend/pdfs/{customer.UserName}/")
  yearlyPath = Path(f"{settings.BASE_DIR}/frontend/static/frontend/pdfs/{customer.UserName}/{year}")
  monthlyPath =Path(f"{settings.BASE_DIR}/frontend/static/frontend/pdfs/{customer.UserName}/{year}/{month}")

  if not pdfsPath.exists():
    pdfsPath.mkdir()

  if not customerPath.exists():
    customerPath.mkdir()

  if not yearlyPath.exists():
    yearlyPath.mkdir()

  if not monthlyPath.exists():
    monthlyPath.mkdir()

  return f"{settings.BASE_DIR}/frontend/static/frontend/pdfs/{customer.UserName}/{year}/{month}/{Order.oid}.pdf"

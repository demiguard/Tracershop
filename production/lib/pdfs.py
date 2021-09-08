
import os

from lib.SQL import SQLController

from reportlab.pdfgen import canvas
from PIL import Image


#A pdf page is (595.27 , 841.89)

#Lines are on the format (x1, y1, x2, y2)
TOP_LINE    = (50,50, 545, 50)
BOTTOM_LINE = (50, 791, 545, 791)








def ApplyTemplate(mailTemplate : canvas.Canvas):
  mailTemplate.setStrokeColorRGB(0.0,0.0,0.0)
  mailTemplate.lines([
    TOP_LINE,
    BOTTOM_LINE
  ])
  mailTemplate.drawInlineImage("petlogo_small.png",  417, 750 , width= 128, height=32)


def ApplyCustomer(mailTemplate, Customer):

  mailTemplate.setStrokeColorRGB(0.5,0.5,1.0)  
  mailTemplate.setFont("Helvetica", 11)
  
  

  mailTemplate.lines([
    (55, 780, 200, 780),
    (55, 710, 200, 710)
  ])
  mailTemplate.drawString(58, 765, Customer["Realname"])
  mailTemplate.drawString(58, 750, Customer["contact"])
  mailTemplate.drawString(58, 735, Customer["tlf"])
  mailTemplate.drawString(58, 720, Customer["email1"])
  



def getMail():
  c = canvas.Canvas("testFile.pdf") 
  #
  ApplyTemplate(c)

  customer = SQLController.getCustomer(8)

  ApplyCustomer(c, customer)

  c.save()
  

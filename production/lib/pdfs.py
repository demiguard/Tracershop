from reportlab.pdfgen import canvas
import os


def getMail():
  c = canvas.Canvas("testFile.pdf")
  c.drawString(100,750, "Test")
  c.save()
  

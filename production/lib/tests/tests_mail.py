import socket

from django.test import TestCase

from lib.mail import sendMail, validateEmailAddress, EmailHeader
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass

from datetime import datetime
from database import models

from lib.SQL.SQLController import SQL

class mail_TestCase(TestCase):
  def setUp(self):
    self.sc = SQL.getServerConfig()

  test_customer = CustomerDataClass(
      "UserName",
      1,
      23,
      7,
      "Realname",
      "Christoffer.vilstrup.Jensen@Regionh.dk",
      "Christoffer.vilstrup.Jensen@Regionh.dk",
      "email3",
      "Christoffer.vilstrup.Jensen@Regionh.dk",
      "contact", 20990550, "addr1", "addr2", "addr3", "addr4"
  )
  test_order = ActivityOrderDataClass(
    datetime(1993,11,20,11,30), 9001,
    3, 100000, 120000, 200000, 240000,6,1,7,"Test Batch Nummer",-1,5,123456, 13.37,
    datetime(1993,11,20,12,30),"Test Kommentar", "Test_bioanalytiker"
  )

  filename = "test_pdfs/mail_template_order_single_vial.pdf"

  emailHeader = EmailHeader("Christoffer.vilstrup.Jensen@Regionh.dk", "test Subject" , "test Message")

  #def test_prepareMail(self):
  #  mail.prepareMail(self.emailHeader, self.filename)

  def test_sendMail(self): # This test have a dependency on the mail server working
    try:
      sendMail(self.filename, self.test_customer, self.test_order, self.sc)
    except socket.gaierror:
      pass

  def test_valid_email(self):
    self.assertFalse(validateEmailAddress("NotAnEmailaddress"))
    self.assertFalse(validateEmailAddress("Not.An.Emailaddress.dk"))
    self.assertFalse(validateEmailAddress("NotAnEmailaddress@"))
    self.assertFalse(validateEmailAddress("NotAnEmailaddress@still"))

    self.assertTrue(validateEmailAddress("AnEmail@address.dk"))
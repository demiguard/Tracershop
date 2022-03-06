from django.test import TestCase

from lib import mail
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass

from datetime import datetime
from api import models


class mailTests(TestCase):  
  def setUp(self):
    add = models.Address(
      ip="127.0.0.1",
      port=5000,
      description="Tracershop Database Address"
    ).save()

    models.Database.objects.create(
      databaseName="TS_test",
      username="tracershop",
      password="fdg4sale",
      address=add,
      testinDatabase=0
    )


  test_customer = CustomerDataClass(
      "UserName", 
      1, 
      23, 
      7, 
      "Realname", 
      "Christoffer.vilstrup.Jensen@Regionh.dk", 
      "email2", 
      "email3", 
      " email4", 
      "contact", "+45 20 99 05 50", "addr1", "addr2", "addr3", "addr4"
  )
    
  test_order = ActivityOrderDataClass(
    datetime(1993,11,20,11,30), 9001,
    3, 100000, 120000, 200000, 240000,6,1,7,"Test Batch Nummer",-1,5,123456, 13.37,
    datetime(1993,11,20,12,30),"Test Kommentar", "Test_bioanalytiker"
  )

  filename = "test_pdfs/mail_template_order_single_vial.pdf"

  emailHeader = mail.EmailHeader("Christoffer.vilstrup.Jensen@Regionh.dk", "test Subject" , "test Message")

  #def test_prepareMail(self):
  #  mail.prepareMail(self.emailHeader, self.filename)

  def test_sendMail(self):
    mail.sendMail(self.filename, self.test_customer, self.test_order)


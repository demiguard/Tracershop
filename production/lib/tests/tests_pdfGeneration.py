from django.test import TestCase
from reportlab.pdfgen import canvas

from datetime import datetime,date, time

from lib import pdfGeneration
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, InjectionOrderDataClass, IsotopeDataClass, TracerDataClass, VialDataClass



class PDFsGenerationTest(TestCase):
  test_customer = CustomerDataClass(
    "testUser",
    1,
    20,
    1,
    "Test RigtigtNavn",
    "Test@email_1.com",
    "Test@email_2.com",
    "Test@email_3.com",
    "Test@email_4.com",
    "Test Person",
    12345678,
    "addr 1",
    "addr 2",
    "addr 3",
    "addr 4"
  )
  test_long_customer = CustomerDataClass(
    "testUser_with_REAAAAAAAAAAAAALY_LOOOOOOOONG_NAAAAAAMES",
    1,
    20,
    1,
    "Test Rigtigt LAAAAAAAAAAAAAAAAAAAAAAAAAAAAANGT Navn ",
    "TestLAAAAAAAAAAAAAAANGEMAAAAAAAIIIILLLLL@email_1.com",
    "TestLAAAAAAAAAAAAAAANGEMAAAAAAAIIIILLLLL@email_2.com",
    "TestLAAAAAAAAAAAAAAANGEMAAAAAAAIIIILLLLL@email_3.com",
    "TestLAAAAAAAAAAAAAAANGEMAAAAAAAIIIILLLLL@email_4.com",
    "Test LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANG Person",
    12345678,
    "addr 1",
    "addr 2",
    "addr 3",
    "addr 4"
  )

  test_order_oid = 9001

  test_Order = ActivityOrderDataClass(
    datetime(1993,11,20,11,30), test_order_oid,
    3, 100000, 120000, 200000, 240000,6,1,7,"Test Batch Nummer",-1,5,123456.0, 13.37,
    datetime(1993,11,20,12,30),"Test Kommentar", "Test_bioanalytiker"
  )

  test_COID_Order = ActivityOrderDataClass(
    datetime(1993,11,20,11,30),
    test_order_oid + 1,
    3,
    100000.0,
    120000.0,
    0.0,
    0.0,
    6,
    1,
    7,
    "",
    test_order_oid,
    5,
    0,
    0,
    datetime(1993,11,20,12,30),
    "Test Kommentar",
    "Test_bioanalytiker"
  )

  test_vial_order_1 = ActivityOrderDataClass(
    datetime(1993,11,20,11,30),
    test_order_oid + 2,
    3,
    0.0,
    0.0,
    0.0,
    0.0,
    6,
    1,
    7,
    "",
    test_order_oid,
    5,
    610000.0,
    13.37,
    datetime(1993,11,20,12,30),
    "Test Kommentar",
    "Test_bioanalytiker"
  )

  test_vial_order_2  = ActivityOrderDataClass(
    datetime(1993,11,20,11,30),
    test_order_oid + 3 ,
    3,
    0.0,
    0.0,
    0.0,
    0.0,
    6,
    1,
    7,
    "",
    test_order_oid,
    5,
    160000.0,
    13.37,
    datetime(1993,11,20,12,30),
    "Test Kommentar",
    "Test_bioanalytiker"
  )

  test_vial_1 = VialDataClass(
    test_customer.ID,
    "Test Batchnr",
    date(1993, 11, 20),
    time(11,20,0),
    13.37,
    123391912.0,
    42690,
    test_Order.oid
  )

  test_vial_2 = VialDataClass( # Yeah ok the class nameing here, as Steven He would put it: STUUUUPID
    test_customer.ID,
    "Test Batchnr",
    date(1993, 11, 20),
    time(11,22,32),
    13.37,
    1333.01,
    42691,
    test_vial_order_1.oid
  )

  test_vial_3 = VialDataClass( # Yeah ok the class nameing here, as Steven He would put it: STUUUUPID
    test_customer.ID,
    "Test Batchnr",
    date(1993, 11, 20),
    time(11,24,32),
    13.37,
    1233112.0,
    42692,
    test_vial_order_2.oid
  )

  test_tracer = TracerDataClass(
    6,
    "FDG",
    1, -1, 0, True, 1,
    "Fludeoxyglucose"
  )

  test_Injection_tracer = TracerDataClass(
    5, "Test Inj tracer",
    1, 100, 0, True, 1, "Test Injection Long Name"
  )

  test_isotope = IsotopeDataClass(1, "F-18", 65567)

  test_injection_order = InjectionOrderDataClass(
    datetime(2000, 11, 20, 11, 20, 12, 123),
    6611, 3, 2, "Human",
    "test Comment", "cjen0668",
    test_Injection_tracer.id, test_customer.ID, "Test Batch number",
    test_customer.ID, datetime(2000, 11, 20, 11, 15, 17, 123)
  )


  def test_PDF_single_order_single_vial(self):
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/mail_template_order_single_vial.pdf",
      self.test_customer,
      self.test_Order,
      [self.test_vial_1],
      self.test_isotope,
      self.test_tracer
    )

  def test_PDF_long_name(self):
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/mail_template_long_customer_Name.pdf",
      self.test_long_customer,
      self.test_Order,
      [self.test_vial_1],
      self.test_isotope,
      self.test_tracer
    )

  def test_PDF_order_coid_single_vial(self):
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/mail_template_order_coid_single_vial.pdf",
      self.test_customer,
      self.test_Order,
      [self.test_vial_1],
      self.test_isotope,
      self.test_tracer
    )

  def test_PDF_Order_COID_many_vials(self):
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/mail_template_order_coid_many_vial.pdf",
      self.test_customer,
      self.test_Order,
      [self.test_vial_1, self.test_vial_2, self.test_vial_3],
      self.test_isotope,
      self.test_tracer
    )

  def test_PDF_Order(self): # Maybe Take another look here, There seams to be some issue here
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/DrawActivityOrder.pdf",
      self.test_customer,
      self.test_Order,
      [self.test_vial_1],
      self.test_isotope,
      self.test_tracer)

  def test_PDF_ORDER_With_COID(self):
    pdfGeneration.DrawActivityOrder(
      "test_pdfs/DrawActivityOrderCOID.pdf",
      self.test_customer,
      self.test_Order,
      [self.test_vial_1, self.test_vial_2, self.test_vial_3],
      self.test_isotope,
      self.test_tracer,
      COID_ORDER=self.test_COID_Order,
      VialOrders=[self.test_vial_order_1, self.test_vial_order_2]
    )

  def test_PDFInjectionOrder(self):
    pdfGeneration.DrawInjectionOrder(
      "test_pdfs/DrawInjectionOrder.pdf", self.test_customer, self.test_injection_order, self.test_isotope, self.test_tracer
    )

# Python standard Library
from os import environ
from pathlib import Path
from datetime import datetime,date, time
from unittest import skip, main

# Third party packages
from django.test import TestCase, TransactionTestCase
from reportlab.pdfgen import canvas

# Tracershop Packages
from constants import ENV_TEST_PDF_DIRECTORY, ENV_TEST_PDF_DIRECTORY_DEFAULT
from lib import pdfGeneration
from database.models import ActivityDeliveryTimeSlot, ActivityOrder, \
  ActivityProduction, Customer, DeliveryEndpoint,InjectionOrder, Isotope,\
  OrderStatus, Tracer, TracerTypes, TracerUsage, Vial, WeeklyRepeat

test_output_directory = Path(environ.get(ENV_TEST_PDF_DIRECTORY,
                                         ENV_TEST_PDF_DIRECTORY_DEFAULT))

if not test_output_directory.exists():
  test_output_directory.mkdir(exist_ok=True)

class PDFsGenerationTest(TestCase):
  def setUp(self) -> None:

    self.orderDate = date(1707, 4, 15)
    self.isotope = Isotope(
      id = 123,
      atomic_number = 57,
      atomic_mass = 123,
      halflife_seconds = 123.123,
      atomic_letter = "Æ",
    )

    self.tracer = Tracer(
      id =492,
      shortname = "a_tracer",
      clinical_name = "Klinsk Navn",
      isotope =self.isotope,
      tracer_type = TracerTypes.ActivityBased,
    )
    self.injection_tracer = Tracer(
      id =492,
      shortname = "a_tracer",
      clinical_name = "Klinsk Navn",
      isotope =self.isotope,
      tracer_type = TracerTypes.InjectionBased,
    )

    self.customer = Customer(id= 5634,
                             short_name= "kunde",
                             long_name= "Kundens organisation",
                             dispenser_id= 2,
                             billing_address= "kunde addresse",
                             billing_city= "kunde by",
                             billing_email= "kunde email",
                             billing_phone= "kunde telefon",
                             billing_zip_code= "zip code")

    self.endpoint = DeliveryEndpoint(id=23991,
                                address="Endpoint address",
                                city="endpoint city",
                                zip_code="zip code",
                                phone="kunde telefon",
                                name="Endpoint name",
                                owner = self.customer)

    self.production_1 = ActivityProduction(id = 78341,
                                  production_day=4,
                                  tracer=self.tracer,
                                  production_time=time(6,30,0))

    self.production_2 = ActivityProduction(id = 78342,
                                  production_day=4,
                                  tracer=self.tracer,
                                  production_time=time(16,30,0))

    self.time_slot_1 = ActivityDeliveryTimeSlot(id = 48720,
                                                weekly_repeat = WeeklyRepeat.EveryWeek,
                                                delivery_time = time(7,45,0),
                                                destination = self.endpoint,
                                                production_run = self.production_1)

    self.time_slot_2 = ActivityDeliveryTimeSlot(id = 48721,
                                                weekly_repeat = WeeklyRepeat.EveryWeek,
                                                delivery_time = time(17,45,0),
                                                destination = self.endpoint,
                                                production_run = self.production_2)

    self.activity_order = ActivityOrder(id=38104,
                            ordered_activity=8311,
                            delivery_date=self.orderDate,
                            status=OrderStatus.Released,
                            comment="Hello I'm a test comment",
                            ordered_time_slot=self.time_slot_1,
                            moved_to_time_slot=None,
                            freed_datetime=datetime(1707,4,15,7,58,11),)

    self.vial = Vial(id=8181,
                     tracer=self.tracer,
                     activity=8421,
                     volume=13.44,
                     lot_number="Batch 1",
                     fill_time=time(7,55,21),
                     fill_date=self.orderDate,
                     assigned_to=self.activity_order,
                     owner=self.customer)

    self.injection_order = InjectionOrder(id=5112,
                                          delivery_time=time(13,45,00),
                                          delivery_date=date(1777,4,30),
                                          injections=2,
                                          status=OrderStatus.Released,
                                          tracer_usage=TracerUsage.human,
                                          comment="",
                                          endpoint=self.endpoint,
                                          tracer=self.tracer,
                                          lot_number="BatchNumber",
                                          freed_datetime=datetime(1777,4,30,13,44,51),
    )

  def test_createActivityPDF_singleOrderVial(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdfGeneration.DrawActivityOrder(
      str(output_path),
      self.orderDate,
      self.endpoint,
      [self.production_1, self.production_2],
      [self.activity_order],
      [self.vial])

  def test_createInjectionPDF(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdfGeneration.DrawInjectionOrder(str(output_path), self.injection_order)

  def test_createReleaseDocument(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdfGeneration.DrawReleaseCertificate(str(output_path),
                                         self.orderDate,
                                         self.endpoint,
                                         self.production_1,
                                         [self.activity_order],
                                         [self.vial])
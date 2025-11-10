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

from lib import pdf_generation
from database.TracerShopModels.baseModels import Days
from database.models import ActivityDeliveryTimeSlot, ActivityOrder, \
  ActivityProduction, Customer, DeliveryEndpoint,InjectionOrder, Isotope,\
  OrderStatus, Tracer, TracerTypes, TracerUsage, Vial, WeeklyRepeat, IsotopeDelivery,\
  IsotopeOrder, IsotopeVial, IsotopeProduction, User, UserGroups

test_output_directory = Path(environ.get(ENV_TEST_PDF_DIRECTORY,
                                         ENV_TEST_PDF_DIRECTORY_DEFAULT))

if not test_output_directory.exists():
  test_output_directory.mkdir(exist_ok=True)

class PDFsGenerationTest(TestCase):
  def setUp(self) -> None:

    self.shop_user = User(
      id=67298034,
      username="ShopUser",
      password="",
      user_group=UserGroups.ShopUser
    )

    self.prod_user = User(
      id=67298035,
      username="ProdUser",
      password="",
      user_group=UserGroups.ProductionUser
    )

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

    self.isotope_production = IsotopeProduction(
      id=8793451,
      isotope=self.isotope,
      production_day=Days.Monday,
      production_time=time(4,0,0),
      expiry_time=None
    )

    self.isotope_delivery = IsotopeDelivery(
      id=76389123,
      production=self.isotope_production,
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_endpoint=self.endpoint,
      delivery_time=time(6,0,0),
    )

    self.isotope_order_1 = IsotopeOrder(
      id=1763859,
      status=OrderStatus.Released,
      order_by=self.shop_user,
      ordered_activity_MBq=100009,
      destination=self.isotope_delivery,
      delivery_date=date(2025,11,11),
      comment=None,
      freed_by=self.prod_user,
      freed_datetime=datetime(2025,11,11,11,11,11),
    )

    self.isotope_order_2 = IsotopeOrder(
      id=1763860,
      status=OrderStatus.Released,
      order_by=self.shop_user,
      ordered_activity_MBq=100019,
      destination=self.isotope_delivery,
      delivery_date=date(2025,11,11),
      comment=None,
      freed_by=self.prod_user,
      freed_datetime=datetime(2025,11,11,11,11,11),
    )

    self.isotope_vials = IsotopeVial(
      id=7512351,
      batch_nr="Æ-251111-1",
      delivery_with=self.isotope_order_1,
      volume=10.0,
      calibration_datetime=datetime(2025,11,11,10,00,00),
      vial_activity=6819024.0,
      isotope=self.isotope
    )

  def test_createActivityPDF_singleOrderVial(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdf_generation.DrawActivityOrder(
      str(output_path),
      self.orderDate,
      self.endpoint,
      [self.production_1, self.production_2],
      [self.activity_order],
      [self.vial])

  def test_createInjectionPDF(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdf_generation.DrawInjectionOrder(str(output_path), self.injection_order)

  def test_createReleaseDocument(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdf_generation.DrawReleaseCertificate(str(output_path),
                                         self.orderDate,
                                         self.endpoint,
                                         self.production_1,
                                         [self.activity_order],
                                         [self.vial])

  def test_create_isotope_release_document(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    pdf_generation.draw_isotope_release_document(
      str(output_path),
      self.isotope_delivery,
      [self.isotope_order_1, self.isotope_order_2],
      [self.isotope_vials]
    )

  def test_create_vial_label(self):
    output_path = test_output_directory / f"{self._testMethodName}.pdf"
    label = pdf_generation.label.VialLabel(
      str(output_path),
      Vial(
      tracer=self.tracer,
      activity = 1000.0,
      volume = 10.0,
      lot_number = "F-251102-1",
      fill_date = date(2025,11,23),
      fill_time = time(11,22,33)
      )
    )

  def test_create_vial_label_postscript(self):
    output_path = test_output_directory / f"{self._testMethodName}.eps"
    pdf_generation.label.get_label_post_script(
      str(output_path),
      Vial(
        tracer=self.tracer,
        activity = 1000.0,
        volume = 10.0,
        lot_number = "F-251102-1",
        fill_date = date(2025,11,23),
        fill_time = time(11,22,33)
      )
    )

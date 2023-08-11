# Python standard Library
from datetime import datetime,date, time
from unittest import skip

# Third party packages
from django.test import TestCase, TransactionTestCase
from reportlab.pdfgen import canvas

# Tracershop Packages
from lib import pdfGeneration
from database.models import ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Customer, DeliveryEndpoint,InjectionOrder, Isotope, OrderStatus, Tracer, TracerTypes, TracerUsage, Vial, WeeklyRepeat

class PDFsGenerationTest(TestCase):
  def test_createActivityPDF_singleOrderVial(self):
    orderDate = date(1707, 4, 15)
    isotope = Isotope(
      isotope_id = 123,
      atomic_number = 57,
      atomic_mass = 123,
      halflife_seconds = 123.123,
      atomic_letter = "Æ",
    )
    tracer = Tracer(
      tracer_id =492,
      shortname = "a_tracer",
      clinical_name = "Klinsk Navn",
      isotope =isotope,
      tracer_type = TracerTypes.ActivityBased,
    )
    customer = Customer(customer_id= 5634,
                        short_name= "kunde",
                        long_name= "Kundens organisation",
                        dispenser_id= 2,
                        billing_address= "kunde addresse",
                        billing_city= "kunde by",
                        billing_email= "kunde email",
                        billing_phone= "kunde telefon",
                        billing_zip_code= "zip code",)
    endpoint = DeliveryEndpoint(tracer_endpoint_id=23991,
                                address="Endpoint address",
                                city="endpoint city",
                                zip_code="zip code",
                                phone="kunde telefon",
                                name="Endpoint name",
                                owner = customer
    )
    production_1 = ActivityProduction(activity_production_id = 78341,
                                      production_day=4,
                                      tracer=tracer,
                                      production_time=time(6,30,0))
    production_2 = ActivityProduction(activity_production_id = 78342,
                                      production_day=4,
                                      tracer=tracer,
                                      production_time=time(16,30,0))

    time_slot_1 = ActivityDeliveryTimeSlot(activity_delivery_time_slot_id = 48720,
                                           weekly_repeat = WeeklyRepeat.EveryWeek,
                                           delivery_time = time(7,45,0),
                                           destination = endpoint,
                                           production_run = production_1,)
    time_slot_2 = ActivityDeliveryTimeSlot(activity_delivery_time_slot_id = 48721,
                                           weekly_repeat = WeeklyRepeat.EveryWeek,
                                           delivery_time = time(17,45,0),
                                           destination = endpoint,
                                           production_run = production_2,)
    order_1 = ActivityOrder(activity_order_id=38104,
                            ordered_activity=8311,
                            delivery_date=orderDate,
                            status=OrderStatus.Released,
                            comment="Hello I'm a test comment",
                            ordered_time_slot=time_slot_1,
                            moved_to_time_slot=None,
                            freed_datetime=datetime(1707,4,15,7,58,11),)
    vial_1 = Vial(vial_id=8181,
                  tracer=tracer,
                  activity=8421,
                  volume=13.44,
                  lot_number="Batch 1",
                  fill_time=time(7,55,21),
                  fill_date=orderDate,
                  assigned_to=order_1,
                  owner=customer,)

    pdfGeneration.DrawActivityOrder(
      f'test_pdfs/{self._testMethodName}.pdf',
      orderDate,
      endpoint,
      [production_1, production_2],
      [order_1],
      [vial_1]
      )

  def test_createInjectionPDF(self):
    isotope = Isotope(
      isotope_id = 123,
      atomic_number = 57,
      atomic_mass = 123,
      halflife_seconds = 123.123,
      atomic_letter = "Æ",)
    tracer = Tracer(
      tracer_id =492,
      shortname = "a_tracer",
      clinical_name = "Klinsk Navn",
      isotope =isotope,
      tracer_type = TracerTypes.InjectionBased,
    )
    customer = Customer(customer_id= 5634,
                        short_name= "kunde",
                        long_name= "Kundens organisation",
                        dispenser_id= 2,
                        billing_address= "kunde addresse",
                        billing_city= "kunde by",
                        billing_email= "kunde email",
                        billing_phone= "kunde telefon",
                        billing_zip_code= "zip code",)
    endpoint = DeliveryEndpoint(tracer_endpoint_id=23991,
                                address="Endpoint address",
                                city="endpoint city",
                                zip_code="zip code",
                                phone="kunde telefon",
                                name="Endpoint name",
                                owner = customer)


    injectionOrder = InjectionOrder(injection_order_id=5112,
                                    delivery_time=time(13,45,00),
                                    delivery_date=date(1777,4,30),
                                    injections=2,
                                    status=OrderStatus.Released,
                                    tracer_usage=TracerUsage.human,
                                    comment="",
                                    endpoint=endpoint,
                                    tracer=tracer,
                                    lot_number="BatchNumber",
                                    freed_datetime=datetime(1777,4,30,13,44,51),

    )


    pdfGeneration.DrawInjectionOrder(
      f'test_pdfs/{self._testMethodName}.pdf',
      injectionOrder
      )


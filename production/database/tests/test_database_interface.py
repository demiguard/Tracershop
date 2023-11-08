# Python Standard Library
from datetime import time, date
import asyncio
from unittest import skip
# Third party package
from django.test import TransactionTestCase
from django.db.models import CharField

# Tracershop Modules
from database.models import Booking, Procedure, User, Tracer, Isotope, Location, BookingStatus
from database.database_interface import DatabaseInterface

# Create your tests here.
class DatabaseInterFaceTestCases(TransactionTestCase):
  def setUp(self) -> None:
    self.db = DatabaseInterface()
    

  def tearDown(self) -> None:
    pass

  @skip
  def test_database_interface_mass_order_activity(self):

    accession_number_1 = "REGH10642011"
    accession_number_2 = "REGH10642012"
    accession_number_3 = "REGH10642013"
    accession_number_4 = "REGH10642014"
    accession_number_5 = "REGH10642015"

    location = Location(
      location_code="BLA30BLA",
      endpoint=self.endpoint,
      common_name="Bla bla",
    )
    location.save()

    procedure = Procedure(
      series_description="",
      tracer_units=300,
      in_use=True,
      delay_minutes=45,
      tracer=self.tracer_activity,
    )
    procedure.save()

    # 2018-03-12 is a monday
    bookingDate = date(2018,3, 12)


    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_1,
        start_time=time(9,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_2,
        start_time=time(10,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_3,
        start_time=time(11,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_4,
        start_time=time(12,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_5,
        start_time=time(13,15,0),
        start_date=bookingDate,
      ).save()

    asyncio.run(self.db.massOrder({
      accession_number_1 : True,
      accession_number_2 : True,
      accession_number_3 : True,
      accession_number_4 : True,
      accession_number_5 : True,
    }, self.test_admin))

  @skip
  def test_database_interface_mass_order_injection(self):
    accession_number_1 = "REGH10642011"
    accession_number_2 = "REGH10642012"
    accession_number_3 = "REGH10642013"
    accession_number_4 = "REGH10642014"
    accession_number_5 = "REGH10642015"

    location = Location(
      location_code="BLA30BLA",
      endpoint=self.endpoint,
      common_name="Bla bla",
    )
    location.save()

    procedure = Procedure(
      series_description="",
      tracer_units=1,
      in_use=True,
      delay_minutes=45,
      tracer=self.tracer_injection,
    )
    procedure.save()

    # 2018-03-12 is a monday
    bookingDate = date(2018,3, 12)


    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_1,
        start_time=time(9,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_2,
        start_time=time(10,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_3,
        start_time=time(11,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_4,
        start_time=time(12,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=location,
        procedure=procedure,
        accession_number=accession_number_5,
        start_time=time(13,15,0),
        start_date=bookingDate,
      ).save()

    asyncio.run(self.db.massOrder({
      accession_number_1 : True,
      accession_number_2 : True,
      accession_number_3 : True,
      accession_number_4 : True,
      accession_number_5 : True,
    }, self.test_admin))

    bookings = Booking.objects.filter(accession_number__in=[
      accession_number_1, accession_number_2, accession_number_3, accession_number_4, accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Ordered)


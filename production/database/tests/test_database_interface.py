# Python Standard Library
from datetime import time, date
import asyncio
from unittest import skip
from unittest.mock import patch

# Mocks
from tracerauth.tests.mocks import mocks_ldap

# Third party package
from django.test import TransactionTestCase
from django.db.models import CharField

# Tracershop Modules
from shared_constants import SUCCESS_STATUS_CREATING_USER_ASSIGNMENT
from database.models import Booking, Procedure, User, Tracer, Isotope,\
  Location, BookingStatus, UserGroups, ProcedureIdentifier, Customer,\
  DeliveryEndpoint, TracerTypes, ActivityOrder, InjectionOrder,\
  ActivityDeliveryTimeSlot, ActivityProduction, Days, WeeklyRepeat,\
  UserAssignment

with patch('tracerauth.ldap.checkUserGroupMembership', mocks_ldap.checkUserGroupMembership):
  from database.database_interface import DatabaseInterface

# Create your tests here.
class DatabaseInterFaceTestCases(TransactionTestCase):
  def setUp(self) -> None:
    self.db = DatabaseInterface()
    self.test_admin = User(username="test_admin", user_group= UserGroups.Admin)
    self.test_admin.save()

    self.shop_admin = User(username="shop_admin", user_group= UserGroups.ShopAdmin)
    self.shop_admin.save()

    self.accession_number_1 = "REGH10642011"
    self.accession_number_2 = "REGH10642012"
    self.accession_number_3 = "REGH10642013"
    self.accession_number_4 = "REGH10642014"
    self.accession_number_5 = "REGH10642015"

    self.inj_accession_number_1 = "DKREGH10642011"
    self.inj_accession_number_2 = "DKREGH10642012"
    self.inj_accession_number_3 = "DKREGH10642013"
    self.inj_accession_number_4 = "DKREGH10642014"
    self.inj_accession_number_5 = "DKREGH10642015"

    self.isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds = 1586024.123,
      atomic_letter = 'U'
    )
    self.isotope.save()

    self.tracer = Tracer(isotope = self.isotope,
                         clinical_name="",
                         shortname = "test_tracer",
                         vial_tag="",
                         tracer_type=TracerTypes.ActivityBased
    )
    self.tracer.save()


    self.tracer_inj = Tracer(isotope = self.isotope,
                         clinical_name="",
                         shortname = "test_inj_tracer",
                         vial_tag="",
                         tracer_type=TracerTypes.InjectionBased
    )
    self.tracer_inj.save()

    self.customer = Customer(
      id=124,
      short_name="test_customer"
    )

    self.customer.save()

    self.endpoint = DeliveryEndpoint(
      id = 512,
      owner = self.customer,
      name="Test_endpoint"
    )
    self.endpoint.save()

    self.location = Location(
      location_code="BLA30BLA",
      endpoint=self.endpoint,
      common_name="Bla bla",
    )
    self.location.save()

    self.procedure_identifier = ProcedureIdentifier(
      code="asdfgkljqwer",
      description="test_procedure"
    )

    self.procedure_identifier.save()

    self.procedure = Procedure(
      id=5687920,
      series_description = self.procedure_identifier,
      tracer=self.tracer,
      tracer_units=300,
      delay_minutes=30,
      owner=self.endpoint
    )
    self.procedure.save()


    self.procedure_identifier_inj = ProcedureIdentifier(
      code="asdfgkl587jqwer",
      description="test_procedure_inj"
    )

    self.procedure_identifier_inj.save()


    self.procedure_inj = Procedure(
      id=56879125,
      series_description = self.procedure_identifier_inj,
      tracer=self.tracer_inj,
      tracer_units=1,
      delay_minutes=0,
      owner=self.endpoint
    )
    self.procedure_inj.save()

    # Extra data accessed by the function
    self.production = ActivityProduction(
      id = 681761,
      production_day = Days.Monday,
      tracer=self.tracer,
      production_time=time(0,20,30)
    )

    self.production.save()

    self.timeslot = ActivityDeliveryTimeSlot(
      id = 17893046,
      weekly_repeat = WeeklyRepeat.EveryWeek,
      delivery_time = time(1,33,33),
      destination = self.endpoint,
      production_run = self.production,
    ).save()


    # 2018-03-12 is a monday
    bookingDate = date(2018,3, 12)

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier,
        accession_number=self.accession_number_1,
        start_time=time(9,15,0),
        start_date=bookingDate,
    ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier,
        accession_number=self.accession_number_2,
        start_time=time(10,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier,
        accession_number=self.accession_number_3,
        start_time=time(11,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier,
        accession_number=self.accession_number_4,
        start_time=time(12,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier,
        accession_number=self.accession_number_5,
        start_time=time(13,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier_inj,
        accession_number=self.inj_accession_number_1,
        start_time=time(9,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier_inj,
        accession_number=self.inj_accession_number_2,
        start_time=time(10,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier_inj,
        accession_number=self.inj_accession_number_3,
        start_time=time(11,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier_inj,
        accession_number=self.inj_accession_number_4,
        start_time=time(12,15,0),
        start_date=bookingDate,
      ).save()

    Booking(
        status=BookingStatus.Initial,
        location=self.location,
        procedure=self.procedure_identifier_inj,
        accession_number=self.inj_accession_number_5,
        start_time=time(13,15,0),
        start_date=bookingDate,
      ).save()


  def tearDown(self) -> None:
    ActivityOrder.objects.all().delete()
    InjectionOrder.objects.all().delete()
    ActivityDeliveryTimeSlot.objects.all().delete()
    ActivityProduction.objects.all().delete()
    Booking.objects.all().delete()
    Procedure.objects.all().delete()
    Location.objects.all().delete()
    ProcedureIdentifier.objects.all().delete()
    DeliveryEndpoint.objects.all().delete()
    UserAssignment.objects.all().delete()
    Customer.objects.all().delete()
    Tracer.objects.all().delete()
    Isotope.objects.all().delete()
    User.objects.all().delete()

  def test_database_interface_mass_order_activity(self):
    asyncio.run(self.db.massOrder({
      self.accession_number_1 : True,
      self.accession_number_2 : True,
      self.accession_number_3 : True,
      self.accession_number_4 : True,
      self.accession_number_5 : True,
    }, self.test_admin))

  def test_database_interface_mass_order_injection(self):

    res = asyncio.run(self.db.massOrder({
      self.inj_accession_number_1 : True,
      self.inj_accession_number_2 : True,
      self.inj_accession_number_3 : True,
      self.inj_accession_number_4 : True,
      self.inj_accession_number_5 : True,
    }, self.test_admin))

    print(res)

    bookings = Booking.objects.filter(accession_number__in=[
      self.inj_accession_number_1,
      self.inj_accession_number_2,
      self.inj_accession_number_3,
      self.inj_accession_number_4,
      self.inj_accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Ordered)


  async def test_createUserAssignment_existingUser(self):
    username = self.shop_admin.username
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNone(user)


  async def test_createUserAssignment_missingUser(self):
    username = "-AAAA0003"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNotNone(user)
    self.assertEqual(user.user_group, mocks_ldap.mockedUserGroups[user.username])

  async def test_createUserAssignment_NotAUser(self):
    username = "not a username"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.NO_LDAP_USERNAME)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  async def test_createUserAssignment_AssignmentToSiteAdmin(self):
    username = "-AAAA0000"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.INCORRECT_GROUPS)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  async def test_createUserAssignment_MissingCustomer(self):
    username = "-AAAA0003"
    status, userAssignment, user = await self.db.createUserAssignment(username, 189508160918, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.MISSING_CUSTOMER)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)


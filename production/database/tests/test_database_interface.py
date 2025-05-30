# Python Standard Library
import asyncio
from datetime import time, date, datetime, timezone
from logging import DEBUG, INFO, ERROR
from unittest import skip
from unittest.mock import patch
from pprint import pprint


# Mocks
from asgiref.sync import sync_to_async
from tracerauth.tests.mocks import mocks_ldap

# Third party package
from django.core.serializers import serialize, deserialize, json
from django.test import TransactionTestCase
from django.contrib.auth import authenticate

# Tracershop Modules
from testing import TransactionTracershopTestCase
from constants import ERROR_LOGGER, DEBUG_LOGGER, AUDIT_LOGGER
from core.exceptions import IllegalActionAttempted, UndefinedReference,\
  RequestingNonExistingEndpoint
from shared_constants import SUCCESS_STATUS_CRUD,\
  DATA_ACTIVITY_ORDER, DATA_ISOTOPE, DATA_BOOKING
from database.models import Booking, Procedure, User, Tracer, Isotope,\
  Location, BookingStatus, UserGroups, ProcedureIdentifier, Customer,\
  DeliveryEndpoint, TracerTypes, ActivityOrder, InjectionOrder,\
  ActivityDeliveryTimeSlot, ActivityProduction, Days, WeeklyRepeat,\
  UserAssignment, OrderStatus, Vial, TracerUsage

from lib.ProductionJSON import decode

from database.database_interface import DatabaseInterface


DEFAULT_TEST_ORDER_DATE = date(2020,4,15)

# Create your tests here.
class DatabaseInterFaceTestCases(TransactionTracershopTestCase):

  def setUp(self) -> None:
    self.db = DatabaseInterface()
    self.test_admin = User.objects.create(username="test_admin",
                                          user_group= UserGroups.Admin)
    self.shop_admin = User.objects.create(username="shop_admin",
                                          user_group= UserGroups.ShopAdmin)
    self.shop_external = User.objects.create(username="shop_external",
                                          user_group= UserGroups.ShopExternal)

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

    self.tracer = Tracer.objects.create(isotope = self.isotope,
                                        clinical_name="",
                                        shortname = "test_tracer",
                                        vial_tag="",
                                        tracer_type=TracerTypes.ActivityBased)

    self.tracer_inj = Tracer.objects.create(isotope = self.isotope,
                                            clinical_name="",
                                            shortname = "test_inj_tracer",
                                            vial_tag="",
                                            tracer_type=TracerTypes.InjectionBased
    )

    self.customer = Customer.objects.create(
      id=124,
      short_name="test_customer"
    )

    self.endpoint = DeliveryEndpoint.objects.create(
      id = 512,
      owner = self.customer,
      name="Test_endpoint"
    )

    self.other_endpoint = DeliveryEndpoint.objects.create(
      id = 513,
      owner = self.customer,
      name="other_endpoint"
    )

    self.location = Location.objects.create(
      location_code="BLA30BLA",
      endpoint=self.endpoint,
      common_name="Bla bla",
    )

    self.location_unknown_endpoint = Location.objects.create(
      location_code="missing_endpoint",
      endpoint=None,
      common_name="Missing endpoint",
    )

    self.procedure_identifier = ProcedureIdentifier.objects.create(
      code="asdfgkljqwer",
      description="test_procedure"
    )

    self.procedure = Procedure.objects.create(
      id=5687920,
      series_description = self.procedure_identifier,
      tracer=self.tracer,
      tracer_units=300,
      delay_minutes=30,
      owner=self.endpoint
    )

    self.procedure_identifier_inj = ProcedureIdentifier.objects.create(
      code="asdfgkl587jqwer",
      description="test_procedure_inj"
    )

    self.procedure_identifier_missing = ProcedureIdentifier.objects.create(
      code="Missing",
      description="Missing",
    )

    self.procedure_inj = Procedure.objects.create(
      id=56879125,
      series_description = self.procedure_identifier_inj,
      tracer=self.tracer_inj,
      tracer_units=1,
      delay_minutes=0,
      owner=self.endpoint
    )


    # Extra data accessed by the function
    self.production = ActivityProduction.objects.create(
      id = 681761,
      production_day = Days.Monday,
      tracer=self.tracer,
      production_time=time(0,20,30)
    )

    self.production_thursday = ActivityProduction.objects.create(
      id = 681762,
      production_day = Days.Thursday,
      tracer=self.tracer,
      production_time=time(0,20,30)
    )

    self.timeslot = ActivityDeliveryTimeSlot.objects.create(
      id = 17893046,
      weekly_repeat = WeeklyRepeat.EveryWeek,
      delivery_time = time(1,33,33),
      destination = self.endpoint,
      production_run = self.production,
    )

    self.timeslot_2 = ActivityDeliveryTimeSlot.objects.create(
      id = 17893047,
      weekly_repeat = WeeklyRepeat.EveryWeek,
      delivery_time = time(11,33,33),
      destination = self.endpoint,
      production_run = self.production,
    )

    self.time_slot_thursday = ActivityDeliveryTimeSlot.objects.create(
      id=17892415,
      weekly_repeat =WeeklyRepeat.EvenWeek,
      delivery_time = time(12,34,56),
      destination = self.endpoint,
      production_run=self.production_thursday
    )

    self.time_slot_other_destination = ActivityDeliveryTimeSlot.objects.create(
      id=17895612,
      weekly_repeat =WeeklyRepeat.EvenWeek,
      delivery_time = time(12,34,56),
      destination = self.other_endpoint,
      production_run=self.production
    )


    # 2018-03-12 is a monday
    self.booking_date = date(2018, 3, 12)

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number=self.accession_number_1,
      start_time=time(9,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number=self.accession_number_2,
      start_time=time(10,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number=self.accession_number_3,
      start_time=time(11,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number=self.accession_number_4,
      start_time=time(12,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number=self.accession_number_5,
      start_time=time(13,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_inj,
      accession_number=self.inj_accession_number_1,
      start_time=time(9,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_inj,
      accession_number=self.inj_accession_number_2,
      start_time=time(10,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_inj,
      accession_number=self.inj_accession_number_3,
      start_time=time(11,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_inj,
      accession_number=self.inj_accession_number_4,
      start_time=time(12,15,0),
      start_date=self.booking_date,
    )

    Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_inj,
      accession_number=self.inj_accession_number_5,
      start_time=time(13,15,0),
      start_date=self.booking_date,
    )

    self.booking_missing_procedure = Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier_missing,
      accession_number="Missing",
      start_time=time(13,15,00),
      start_date=date(2011,12,11)
    )

    self.booking_missing_endpoint = Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location_unknown_endpoint,
      procedure=self.procedure_identifier,
      accession_number="missing_location",
      start_time=time(12,11,44),
      start_date=date(2033,11,12)
    )

    self.booking_missing_time_slot = Booking.objects.create(
      status=BookingStatus.Initial,
      location=self.location,
      procedure=self.procedure_identifier,
      accession_number="missing_time_slot",
      start_time=time(0,0,0),
      start_date=self.booking_date,
    )

    self.order = ActivityOrder.objects.create(
      id=1513113,
      ordered_activity=104125112.1214,
      delivery_date=DEFAULT_TEST_ORDER_DATE,
      status=OrderStatus.Released,
      ordered_time_slot=self.timeslot,
      freed_by=self.test_admin,
      freed_datetime=datetime(2020,4,15,12,4,12, tzinfo=timezone.utc),
      ordered_by=self.shop_admin,
    )

    self.release_able_order = ActivityOrder.objects.create(
      id=1513114,
      ordered_activity=104125112.1214,
      delivery_date=DEFAULT_TEST_ORDER_DATE,
      status=OrderStatus.Accepted,
      ordered_time_slot=self.timeslot,
      ordered_by=self.shop_admin,
    )

    self.moveable_order = ActivityOrder.objects.create(
      id=1513115,
      ordered_activity=104125112.1214,
      delivery_date=date(2020,4, 15),
      status=OrderStatus.Accepted,
      ordered_time_slot=self.timeslot_2,
      ordered_by=self.shop_admin,
    )

    self.vial = Vial.objects.create(
      id=781934,
      tracer=self.tracer,
      activity=51895,
      volume=12.12,
      lot_number="GDA-200415-1",
      fill_time=time(9,44,11),
      fill_date=DEFAULT_TEST_ORDER_DATE,
      owner=self.customer
    )

    self.injection_order = InjectionOrder.objects.create(
      id=32177693,
      delivery_time=time(11,22,33),
      delivery_date=DEFAULT_TEST_ORDER_DATE,
      injections=1,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.human,
      endpoint=self.endpoint,
      tracer=self.tracer_inj,
      lot_number="Blah blah",
      freed_datetime=datetime(2020,4,15,12,4,12, tzinfo=timezone.utc),
    )

    self.assigned_vial = Vial.objects.create(
      id=781935,
      tracer=self.tracer,
      activity=51895,
      volume=12.12,
      lot_number="GDA-200415-1",
      fill_time=time(9,44,12),
      fill_date=DEFAULT_TEST_ORDER_DATE,
      assigned_to=self.order,
      owner=self.customer
    )

  def tearDown(self) -> None:
    Vial.objects.all().delete()
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
    with self.assertLogs(DEBUG_LOGGER, DEBUG) as recorded_logs:
      asyncio.run(self.db.massOrder({
        self.accession_number_1 : True,
        self.accession_number_2 : True,
        self.accession_number_3 : True,
        self.accession_number_4 : True,
        self.accession_number_5 : True,
      }, self.test_admin))

    bookings = Booking.objects.filter(accession_number__in=[
      self.accession_number_1,
      self.accession_number_2,
      self.accession_number_3,
      self.accession_number_4,
      self.accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Ordered)

  def test_reject_all_of_the_orders(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG) as recorded_logs:
      asyncio.run(self.db.massOrder({
        self.accession_number_1 : False,
        self.accession_number_2 : False,
        self.accession_number_3 : False,
        self.accession_number_4 : False,
        self.accession_number_5 : False,
      }, self.test_admin))

    bookings = Booking.objects.filter(accession_number__in=[
      self.accession_number_1,
      self.accession_number_2,
      self.accession_number_3,
      self.accession_number_4,
      self.accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Rejected)

  def test_database_interface_mass_order_injection(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      asyncio.run(self.db.massOrder({
        self.inj_accession_number_1 : True,
        self.inj_accession_number_2 : True,
        self.inj_accession_number_3 : True,
        self.inj_accession_number_4 : True,
        self.inj_accession_number_5 : True,
      }, self.test_admin))

    bookings = Booking.objects.filter(accession_number__in=[
      self.inj_accession_number_1,
      self.inj_accession_number_2,
      self.inj_accession_number_3,
      self.inj_accession_number_4,
      self.inj_accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Ordered)

  async def test_nonexistent_booking(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
        await self.db.massOrder({
          "asdfqwer" : True,
        }, self.shop_admin)

      self.assertRegexIn("asdfqwer", captured_error_logs.output)

  async def test_order_booking_with_missing_procedure(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
        await self.db.massOrder({
          "Missing" : True,
        }, self.shop_admin)

    self.assertRegexIn("for Booking Missing", captured_error_logs.output)

  async def test_order_booking_with_missing_endpoint(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(RequestingNonExistingEndpoint):
        await self.db.massOrder({
          "missing_location" : True,
        }, self.shop_admin)

    self.assertRegexIn("has no associated endpoint!", captured_error_logs.output)


  async def test_order_missing_time_slot(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(RequestingNonExistingEndpoint):
        await self.db.massOrder({
          "missing_time_slot" : True,
        }, self.shop_admin)

    self.assertRegexIn("that endpoint doesn't have any ActivityDeliveryTimeSlots", captured_error_logs.output)


  async def test_createUserAssignment_existingUser(self):
    username = self.shop_admin.username
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNone(user)


  async def test_createUserAssignment_missingUser(self):
    username = "-AAAA0003"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNotNone(user)
    self.assertEqual(user.user_group, mocks_ldap.mockedUserGroups[user.username])

  async def test_createUserAssignment_NotAUser(self):
    username = "not a username"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.NO_LDAP_USERNAME)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  async def test_createUserAssignment_AssignmentToSiteAdmin(self):
    username = "-AAAA0000"
    status, userAssignment, user = await self.db.createUserAssignment(username, self.customer.id, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.INCORRECT_GROUPS)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  async def test_createUserAssignment_MissingCustomer(self):
    username = "-AAAA0003"
    status, userAssignment, user = await self.db.createUserAssignment(username, 189508160918, self.test_admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.MISSING_CUSTOMER)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  async def test_getModel_with_key(self):
    isotope = await self.db.getModel(Isotope, 235, 'atomic_mass')
    self.assertEqual(isotope.id, self.isotope.id)

  async def test_handleEditModel_cannot_edit(self):
    orders_serialized = serialize('python',[self.order])
    orders = orders_serialized[0]['fields']
    orders['id'] = self.order.id

    response = await self.db.handleEditModels(DATA_ACTIVITY_ORDER,
                                              [orders],
                                              self.shop_admin)
    self.assertIsNone(response)

  async def test_deleteModels_cannot_delete(self):
    response = await self.db.deleteModels(DATA_ACTIVITY_ORDER,
                                          self.order.id,
                                          self.shop_admin)
    self.assertFalse(response)

  async def test_handleCreateModels_list_creation(self):
    response_a = await self.db.handleCreateModels(
      DATA_ISOTOPE, [
        {
          'atomic_number' : 9,
          'atomic_mass' : 18,
          'halflife_seconds' : 5121.2,
          'atomic_letter' : 'F'
        },
        {
          'atomic_number' : 6,
          'atomic_mass' : 11,
          'halflife_seconds' : 125121.2,
          'atomic_letter' : 'C'
        }
      ],
      self.test_admin
    )
    x, y = await sync_to_async(list)(response_a)

    # This say is just a fancy way, that the lsp understands that x and y are
    # Isotopes
    if not isinstance(x, Isotope): # pragma: no cover
      raise AssertionError

    if not isinstance(y, Isotope): # pragma: no cover
      raise AssertionError

    self.assertEqual(x.atomic_number, 9)
    self.assertEqual(x.atomic_mass, 18)
    self.assertEqual(x.atomic_letter, 'F')
    self.assertEqual(x.halflife_seconds, 5121.2)

    self.assertEqual(y.atomic_number, 6)
    self.assertEqual(y.atomic_mass, 11)
    self.assertEqual(y.atomic_letter, 'C')
    self.assertEqual(y.halflife_seconds, 125121.2)

  async def test_releaseOrders_no_rights(self):
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      with self.assertRaises(IllegalActionAttempted):
        await self.db.releaseOrders(
          self.timeslot.id,
          [self.order.id],
          [],
          self.shop_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertRegexIn(self.shop_admin.username, captured_audit_logs.output)

  async def test_releaseOrders_missing_orders_vials(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(UndefinedReference):
        await self.db.releaseOrders(
          self.timeslot.id,
          [],
          [],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  async def test_releaseOrders_missing_vials(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER):
      with self.assertRaises(UndefinedReference):
        await self.db.releaseOrders(
          self.timeslot.id,
          [self.order.id],
          [],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  async def test_releaseOrders_missing_order(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER):
      with self.assertRaises(UndefinedReference):
        await self.db.releaseOrders(
          self.timeslot.id,
          [],
          [self.vial.id],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  async def test_releaseOrders_release_released_order(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(UndefinedReference):
        await self.db.releaseOrders(
          self.timeslot.id,
          [self.order.id],
          [self.vial.id],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  async def test_releaseOrders_orders_to_another_timeslot(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        await self.db.releaseOrders(
          self.timeslot_2.id,
          [self.release_able_order.id],
          [self.vial.id],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  async def test_releaseOrders_releasing_a_assigned_vial(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(UndefinedReference):
        await self.db.releaseOrders(
          self.timeslot.id,
          [self.release_able_order.id],
          [self.assigned_vial.id],
          self.test_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  def test_moving_orders(self):
    o1, o2 = asyncio.run(
      self.db.moveOrders(
        [self.release_able_order.id,self.moveable_order.id],
        self.timeslot.id
      )
    )

  def test_moving_orders_with_no_orders(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      orders = asyncio.run(
        self.db.moveOrders(
          [],
          self.timeslot.id
        )
      )
    self.assertEqual(len(orders), 0)
    self.assertRegexIn("Attempting to move 0 orders",captured_error_logs.output)


  def test_moving_orders_moving_released_order(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        asyncio.run(
          self.db.moveOrders(
            [self.order.id],
            self.timeslot.id
          )
        )
    self.assertEqual(recorded_logs.output[0],
                    "ERROR:ErrorLogger:Attempted to move a released order")

  def test_moving_orders_moving_to_another_destination(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        asyncio.run(
          self.db.moveOrders(
            [self.moveable_order.id],
            self.time_slot_other_destination.id
          )
        )
    self.assertEqual(
      recorded_logs.output[0],
      "ERROR:ErrorLogger:Attempted to set Destination to another endpoints time slot"
    )

  def test_moving_orders_moving_to_another_day(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        asyncio.run(
          self.db.moveOrders(
            [self.moveable_order.id],
            self.time_slot_thursday.id
          )
        )
    self.assertEqual(
      recorded_logs.output[0],
      "ERROR:ErrorLogger:Attempted to set Destination to another time slot produced on another day"
    )

  def test_moving_orders_moving_to_after_delivery(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        asyncio.run(
          self.db.moveOrders(
            [self.release_able_order.id],
            self.timeslot_2.id
          )
        )
    self.assertEqual(
      recorded_logs.output[0],
      f"ERROR:ErrorLogger:Attempted to move an order that should have been delivered: {self.release_able_order.ordered_time_slot.delivery_time} to a time slot which delivers {self.timeslot_2.delivery_time}"
    )

  def test_changeExternalPassword_success(self):
    new_password = "BLABLABLA"
    asyncio.run(
      self.db.changeExternalPassword(
        self.shop_external.id, new_password
      )
    )
    self.assertIsNotNone(authenticate(username=self.shop_external, password=new_password))

  def test_changeExternalPassword_non_external(self):
    new_password = "BLABLABLA"
    with self.assertRaises(IllegalActionAttempted):
      asyncio.run(
        self.db.changeExternalPassword(
          self.shop_admin.id, new_password
        )
      )

  def test_get_bookings(self):
    data = asyncio.run(
      self.db.get_bookings(
        self.booking_date,
        self.endpoint.id
      )
    )
    bookings = [ booking for booking in data[DATA_BOOKING] ]

    self.assertEqual(len(bookings), 11)

  def test_get_csv_data(self):
    out_data = self.db.get_csv_data(DEFAULT_TEST_ORDER_DATE)

    #pprint(out_data)

    # TODO: ASSERT DATA

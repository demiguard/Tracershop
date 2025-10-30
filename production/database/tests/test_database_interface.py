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
from testing import TransactionTracershopTestCase, TracershopTestCase
from constants import ERROR_LOGGER, DEBUG_LOGGER, AUDIT_LOGGER
from core.exceptions import IllegalActionAttempted, UndefinedReference,\
  RequestingNonExistingEndpoint, ContractBroken
from database.database_interface import DatabaseInterface
from shared_constants import *
from database.models import Booking, Procedure, User, Tracer, Isotope,\
  Location, BookingStatus, UserGroups, ProcedureIdentifier, Customer,\
  DeliveryEndpoint, TracerTypes, ActivityOrder, InjectionOrder,\
  ActivityDeliveryTimeSlot, ActivityProduction, Days, WeeklyRepeat,\
  UserAssignment, OrderStatus, Vial, TracerUsage, IsotopeOrder, IsotopeVial,\
  IsotopeProduction, IsotopeDelivery





DEFAULT_TEST_ORDER_DATE = date(2020,4,15)

# Create your tests here.
class DatabaseInterFaceTestCases(TracershopTestCase):
  @classmethod
  def setUpTestData(cls):
    cls.admin = User.objects.create(username="test_admin",
                                          user_group= UserGroups.Admin)
    cls.shop_admin = User.objects.create(username="test_shop_admin",
                                          user_group= UserGroups.ShopAdmin)
    cls.shop_external = User.objects.create(username="shop_external",
                                          user_group= UserGroups.ShopExternal)

    cls.accession_number_1 = "REGH10642011"
    cls.accession_number_2 = "REGH10642012"
    cls.accession_number_3 = "REGH10642013"
    cls.accession_number_4 = "REGH10642014"
    cls.accession_number_5 = "REGH10642015"

    cls.inj_accession_number_1 = "DKREGH10642011"
    cls.inj_accession_number_2 = "DKREGH10642012"
    cls.inj_accession_number_3 = "DKREGH10642013"
    cls.inj_accession_number_4 = "DKREGH10642014"
    cls.inj_accession_number_5 = "DKREGH10642015"

    cls.isotope = Isotope.objects.create(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds = 1586024.123,
      atomic_letter = 'U'
    )

    cls.tracer = Tracer.objects.create(isotope = cls.isotope,
                                       clinical_name="",
                                       shortname = "test_tracer",
                                       vial_tag="",
                                       tracer_type=TracerTypes.ActivityBased)

    cls.tracer_inj = Tracer.objects.create(isotope = cls.isotope,
                                            clinical_name="",
                                            shortname = "test_inj_tracer",
                                            vial_tag="",
                                            tracer_type=TracerTypes.InjectionBased
    )

    cls.customer = Customer.objects.create(
      id=124,
      short_name="test_customer"
    )

    cls.endpoint = DeliveryEndpoint.objects.create(
      id = 512,
      owner = cls.customer,
      name="Test_endpoint"
    )

    cls.other_endpoint = DeliveryEndpoint.objects.create(
      id = 513,
      owner = cls.customer,
      name="other_endpoint"
    )

    cls.location = Location.objects.create(
      location_code="BLA30BLA",
      endpoint=cls.endpoint,
      common_name="Bla bla",
    )

    cls.location_unknown_endpoint = Location.objects.create(
      location_code="missing_endpoint",
      endpoint=None,
      common_name="Missing endpoint",
    )

    cls.procedure_identifier = ProcedureIdentifier.objects.create(
      code="asdfgkljqwer",
      description="test_procedure"
    )

    cls.procedure = Procedure.objects.create(
      id=5687920,
      series_description = cls.procedure_identifier,
      tracer=cls.tracer,
      tracer_units=300,
      delay_minutes=30,
      owner=cls.endpoint
    )

    cls.procedure_identifier_inj = ProcedureIdentifier.objects.create(
      code="asdfgkl587jqwer",
      description="test_procedure_inj"
    )

    cls.procedure_identifier_missing = ProcedureIdentifier.objects.create(
      code="Missing",
      description="Missing",
    )

    cls.procedure_inj = Procedure.objects.create(
      id=56879125,
      series_description = cls.procedure_identifier_inj,
      tracer=cls.tracer_inj,
      tracer_units=1,
      delay_minutes=0,
      owner=cls.endpoint
    )


    # Extra data accessed by the function
    cls.production = ActivityProduction.objects.create(
      id = 681761,
      production_day = Days.Monday,
      tracer=cls.tracer,
      production_time=time(0,20,30)
    )

    cls.production_thursday = ActivityProduction.objects.create(
      id = 681762,
      production_day = Days.Thursday,
      tracer=cls.tracer,
      production_time=time(0,20,30)
    )

    cls.timeslot = ActivityDeliveryTimeSlot.objects.create(
      id = 17893046,
      weekly_repeat = WeeklyRepeat.EveryWeek,
      delivery_time = time(1,33,33),
      destination = cls.endpoint,
      production_run = cls.production,
    )

    cls.timeslot_2 = ActivityDeliveryTimeSlot.objects.create(
      id = 17893047,
      weekly_repeat = WeeklyRepeat.EveryWeek,
      delivery_time = time(11,33,33),
      destination = cls.endpoint,
      production_run = cls.production,
    )

    cls.time_slot_thursday = ActivityDeliveryTimeSlot.objects.create(
      id=17892415,
      weekly_repeat =WeeklyRepeat.EvenWeek,
      delivery_time = time(12,34,56),
      destination = cls.endpoint,
      production_run= cls.production_thursday
    )

    cls.time_slot_other_destination = ActivityDeliveryTimeSlot.objects.create(
      id=17895612,
      weekly_repeat =WeeklyRepeat.EvenWeek,
      delivery_time = time(12,34,56),
      destination = cls.other_endpoint,
      production_run= cls.production
    )

    # 2018-03-12 is a monday
    cls.booking_date = date(2018, 3, 12)

    cls.isotope_production = IsotopeProduction.objects.create(
      id=67219034,
      isotope=cls.isotope,
      production_day=Days.Monday,
      production_time = time(11,33,55)
    )

    cls.isotope_delivery = IsotopeDelivery.objects.create(
      id=658719024,
      production=cls.isotope_production,
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_endpoint=cls.endpoint,
      delivery_time=time(12,34,56)
    )

    cls.now = datetime(2025,11,22,12,34,56)


  def setUp(self) -> None:
    self.db = DatabaseInterface()



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

    self.order_id=1513113
    self.order = ActivityOrder.objects.create(
      id=self.order_id,
      ordered_activity=104125112.1214,
      delivery_date=DEFAULT_TEST_ORDER_DATE,
      status=OrderStatus.Released,
      ordered_time_slot=self.timeslot,
      freed_by=self.admin,
      freed_datetime=datetime(2020,4,15,12,4,12, tzinfo=timezone.utc),
      ordered_by=self.shop_admin,
    )

    self.release_able_order_id = 1513114
    self.release_able_order = ActivityOrder.objects.create(
      id=self.release_able_order_id,
      ordered_activity=104125112.1214,
      delivery_date=DEFAULT_TEST_ORDER_DATE,
      status=OrderStatus.Accepted,
      ordered_time_slot=self.timeslot,
      ordered_by=self.shop_admin,
    )

    self.moveable_order_id = 1513115
    self.moveable_order = ActivityOrder.objects.create(
      id=self.moveable_order_id,
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

  def test_database_interface_mass_order_activity(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG) as recorded_logs:
      self.db.mass_order({
        self.accession_number_1 : True,
        self.accession_number_2 : True,
        self.accession_number_3 : True,
        self.accession_number_4 : True,
        self.accession_number_5 : True,
      }, self.admin)

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
      self.db.mass_order({
        self.accession_number_1 : False,
        self.accession_number_2 : False,
        self.accession_number_3 : False,
        self.accession_number_4 : False,
        self.accession_number_5 : False,
      }, self.admin)

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
      self.db.mass_order({
        self.inj_accession_number_1 : True,
        self.inj_accession_number_2 : True,
        self.inj_accession_number_3 : True,
        self.inj_accession_number_4 : True,
        self.inj_accession_number_5 : True,
      }, self.admin)

    bookings = Booking.objects.filter(accession_number__in=[
      self.inj_accession_number_1,
      self.inj_accession_number_2,
      self.inj_accession_number_3,
      self.inj_accession_number_4,
      self.inj_accession_number_5
    ])

    for booking in bookings:
      self.assertEqual(booking.status, BookingStatus.Ordered)

  def test_nonexistent_booking(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
        self.db.mass_order({
          "asdfqwer" : True,
        }, self.shop_admin)

      self.assertRegexIn("asdfqwer", captured_error_logs.output)

  def test_order_booking_with_missing_procedure(self):
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
        self.db.mass_order({
          "Missing" : True,
        }, self.shop_admin)

    self.assertRegexIn("for Booking Missing", captured_error_logs.output)

  def test_order_booking_with_missing_endpoint(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(RequestingNonExistingEndpoint):
        self.db.mass_order({
          "missing_location" : True,
        }, self.shop_admin)

    self.assertRegexIn("has no associated endpoint!", captured_error_logs.output)


  def test_order_missing_time_slot(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(RequestingNonExistingEndpoint):
        self.db.mass_order({
          "missing_time_slot" : True,
        }, self.shop_admin)

    self.assertRegexIn("that endpoint doesn't have any ActivityDeliveryTimeSlots", captured_error_logs.output)


  def test_createUserAssignment_existingUser(self):
    username = self.shop_admin.username
    status, userAssignment, user = self.db.create_user_assignment(username, self.customer.id, self.admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNone(user)


  def test_createUserAssignment_missingUser(self):
    username = "-AAAA0003"
    status, userAssignment, user = self.db.create_user_assignment(username, self.customer.id, self.admin)

    if user is None: #pragma: no cover
      raise AssertionError("User is None!")

    self.assertEqual(status, SUCCESS_STATUS_CRUD.SUCCESS)
    self.assertIsNotNone(userAssignment)
    self.assertIsNotNone(user)
    self.assertEqual(user.user_group, mocks_ldap.mockedUserGroups[user.username])

  def test_createUserAssignment_NotAUser(self):
    username = "not a username"
    # Act
    status, userAssignment, user = self.db.create_user_assignment(username, self.customer.id, self.admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.NO_LDAP_USERNAME)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  def test_createUserAssignment_AssignmentToSiteAdmin(self):
    username = "-AAAA0000"
    status, userAssignment, user = self.db.create_user_assignment(username, self.customer.id, self.admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.INCORRECT_GROUPS)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  def test_createUserAssignment_MissingCustomer(self):
    username = "-AAAA0003"
    status, userAssignment, user = self.db.create_user_assignment(username, 189508160918, self.admin)

    self.assertEqual(status, SUCCESS_STATUS_CRUD.MISSING_CUSTOMER)
    self.assertIsNone(userAssignment)
    self.assertIsNone(user)

  def test_getModel_with_key(self):
    isotope = self.db.get_model(Isotope, 235, 'atomic_mass')
    self.assertEqual(isotope.id, self.isotope.id)

  def test_handleEditModel_cannot_edit(self):
    orders_serialized = serialize('python',[self.order])
    orders = orders_serialized[0]['fields']
    orders['id'] = self.order.id

    response = self.db.edit_models(DATA_ACTIVITY_ORDER,
                                  [orders],
                                  self.shop_admin)
    self.assertIsNone(response)

  def test_deleteModels_cannot_delete(self):
    response = self.db.delete_models(DATA_ACTIVITY_ORDER,
                                     self.order.id,
                                     self.shop_admin)
    self.assertFalse(response)

  def test_handleCreateModels_list_creation(self):
    response_a = self.db.create_models(
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
      self.admin
    )
    x, y = list(response_a)

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

  def test_releaseOrders_no_rights(self):
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.release_activity_orders(
          self.timeslot.id,
          [self.order_id],
          [],
          self.shop_admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertRegexIn(self.shop_admin.username, captured_audit_logs.output)

  def test_releaseOrders_missing_orders_vials(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(UndefinedReference):
        self.db.release_activity_orders(
          self.timeslot.id,
          [],
          [],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  def test_releaseOrders_missing_vials(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER):
      with self.assertRaises(UndefinedReference):
        self.db.release_activity_orders(
          self.timeslot.id,
          [self.order_id],
          [],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  def test_releaseOrders_missing_order(self):
    """This test is kinda just silly but I wanna make sure these things yell
    """
    with self.assertLogs(ERROR_LOGGER):
      with self.assertRaises(UndefinedReference):
        self.db.release_activity_orders(
          self.timeslot.id,
          [],
          [self.vial.id],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

  def test_releaseOrders_release_released_order(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(UndefinedReference):
        self.db.release_activity_orders(
          self.timeslot.id,
          [self.order_id],
          [self.vial.id],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  def test_releaseOrders_orders_to_another_timeslot(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.release_activity_orders(
          self.timeslot_2.id,
          [self.release_able_order_id],
          [self.vial.id],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  def test_releaseOrders_releasing_a_assigned_vial(self):
    with self.assertLogs(ERROR_LOGGER, ERROR) as recorded_logs:
      with self.assertRaises(UndefinedReference):
        self.db.release_activity_orders(
          self.timeslot.id,
          [self.release_able_order_id],
          [self.assigned_vial.id],
          self.admin,
          datetime(2020,5,11,13,53,12, tzinfo=timezone.utc)
        )

    self.assertEqual(len(recorded_logs.output), 1)

  def test_moving_orders(self):
    o1, o2 = self.db.move_orders(
      [self.release_able_order_id,self.moveable_order_id],
      self.timeslot.id
    )

    # Assert?

  def test_moving_orders_with_no_orders(self):
    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      orders = self.db.move_orders(
        [],
        self.timeslot.id
      )

    self.assertEqual(len(orders), 0)
    self.assertRegexIn("Attempting to move 0 orders",captured_error_logs.output)


  def test_moving_orders_moving_released_order(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.move_orders(
          [self.order_id],
          self.timeslot.id
        )

    self.assertEqual(recorded_logs.output[0],
                    "ERROR:ErrorLogger:Attempted to move a released order")

  def test_moving_orders_moving_to_another_destination(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.move_orders(
          [self.moveable_order_id],
          self.time_slot_other_destination.id
        )
    self.assertEqual(
      recorded_logs.output[0],
      "ERROR:ErrorLogger:Attempted to set Destination to another endpoints time slot"
    )

  def test_moving_orders_moving_to_another_day(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.move_orders(
          [self.moveable_order_id],
          self.time_slot_thursday.id
        )

    self.assertEqual(
      recorded_logs.output[0],
      "ERROR:ErrorLogger:Attempted to set Destination to another time slot produced on another day"
    )

  def test_moving_orders_moving_to_after_delivery(self):
    with self.assertLogs(ERROR_LOGGER,ERROR) as recorded_logs:
      with self.assertRaises(IllegalActionAttempted):
        self.db.move_orders(
          [self.release_able_order_id],
          self.timeslot_2.id
        )

    self.assertEqual(
      recorded_logs.output[0],
      f"ERROR:ErrorLogger:Attempted to move an order that should have been delivered: {self.release_able_order.ordered_time_slot.delivery_time} to a time slot which delivers {self.timeslot_2.delivery_time}"
    )

  def test_changeExternalPassword_success(self):
    new_password = "BLABLABLA"
    self.db.change_external_password(
        self.shop_external.id, new_password
    )

    self.assertIsNotNone(authenticate(username=self.shop_external, password=new_password))

  def test_changeExternalPassword_non_external(self):
    new_password = "BLABLABLA"
    with self.assertRaises(IllegalActionAttempted):
      self.db.change_external_password(
        self.shop_admin.id, new_password
      )

    self.assertIsNone(authenticate(username=self.shop_external, password=new_password))

  def test_get_bookings(self):
    data = self.db.get_bookings(
        self.booking_date,
        self.endpoint.id
      )

    bookings = [ booking for booking in data[DATA_BOOKING] ]

    self.assertEqual(len(bookings), 11)

  def test_get_csv_data(self):
    out_data = self.db.get_csv_data(DEFAULT_TEST_ORDER_DATE)

    #pprint(out_data)

    # TODO: ASSERT DATA


  def test_validation_selection_empty_selection_errors_cases(self):
    with self.assertLogs(ERROR_LOGGER):
      self.assertFalse(self.db.validate_selection([], Vial.objects.filter(id=None)))
      self.assertFalse(self.db.validate_selection([6729038402, 18250112, self.vial.id], Vial.objects.filter(id__in=[self.assigned_vial.id, self.vial.id])))

  def test_serialization(self):
    serialized_dict = self.db.serialize_dict({
      DATA_ISOTOPE : [self.isotope],
      DATA_USER : [self.shop_admin],
      DATA_TRACER : [self.tracer]
    })

    self.assertIn(DATA_ISOTOPE, serialized_dict)
    serialized_isotopes = serialized_dict[DATA_ISOTOPE]
    self.assertEqual(len(serialized_isotopes), 1)

  def test_full_correction(self):
    # Assemble
    ID_ISOTOPE_ORDER = 67832945
    ID_ISOTOPE_VIAL = 67832946
    ID_INJECTION_ORDER = 67832947
    ID_ACTIVITY_ORDER = 67832948
    ID_ACTIVITY_VIAL = 67832949

    isotope_order = IsotopeOrder.objects.create(
      id=ID_ISOTOPE_ORDER,
      status=OrderStatus.Released,
      order_by=self.shop_external,
      ordered_activity_MBq=10000,
      destination=self.isotope_delivery,
      delivery_date=date(2025,5,11),
      freed_by=self.shop_admin,
      freed_datetime=datetime(2025,5,11,11,22,33,tzinfo=timezone.utc),
    )

    isotope_vial = IsotopeVial.objects.create(
      id=ID_ISOTOPE_VIAL,
      batch_nr="A17-251122-1",
      delivery_with=isotope_order,
      volume=10.12,
      calibration_datetime=datetime(2025,5,11,10,10,33, tzinfo=timezone.utc),
      vial_activity=18592.104,
      isotope=self.isotope
    )

    injection_order = InjectionOrder.objects.create(
      id=ID_INJECTION_ORDER,
      delivery_time=time(11,33,44),
      delivery_date=date(2025,5,11),
      injections=1,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.human,
      ordered_by=self.shop_admin,
      endpoint=self.endpoint,
      tracer=self.tracer_inj,
      lot_number="FAKE-250511-1",
      freed_datetime=datetime(2025,5,11,23,44,11,tzinfo=timezone.utc),
      freed_by=self.admin
    )

    # Act
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.db.correct_order(
        {
          DATA_ISOTOPE_ORDER : [ID_ISOTOPE_ORDER],
          DATA_ISOTOPE_VIAL : [ID_ISOTOPE_VIAL],
          DATA_INJECTION_ORDER : [ID_INJECTION_ORDER]
        },
        self.admin
      )

    # Assert
    self.assertEqual(len(captured_audit_logs.output), 3)
    isotope_order.refresh_from_db(fields=['status'])
    self.assertEqual(isotope_order.status, OrderStatus.Accepted)

    isotope_vial.refresh_from_db(fields=['delivery_with'])
    self.assertIsNone(isotope_vial.delivery_with)

    injection_order.refresh_from_db(fields=['status'])
    self.assertEqual(injection_order.status, OrderStatus.Accepted)

  def test_partial_correction_does_not_change(self):
    ID_ISOTOPE_ORDER = 67832945
    ID_ISOTOPE_VIAL = 67832946

    isotope_order = IsotopeOrder.objects.create(
      id=ID_ISOTOPE_ORDER,
      status=OrderStatus.Released,
      order_by=self.shop_external,
      ordered_activity_MBq=10000,
      destination=self.isotope_delivery,
      delivery_date=date(2025,5,11),
      freed_by=self.shop_admin,
      freed_datetime=datetime(2025,5,11,11,22,33,tzinfo=timezone.utc),
    )

    IsotopeVial.objects.create(
      id=ID_ISOTOPE_VIAL,
      batch_nr="A17-251122-1",
      delivery_with=None, # This is the critical change
      volume=10.12,
      calibration_datetime=datetime(2025,5,11,10,10,33, tzinfo=timezone.utc),
      vial_activity=18592.104,
      isotope=self.isotope
    )

    # Act
    with self.assertLogs(ERROR_LOGGER):
      with self.assertNoLogs(AUDIT_LOGGER) as captured_audit_logs:
        self.assertRaises(ContractBroken, self.db.correct_order, {
            DATA_ISOTOPE_ORDER : [ID_ISOTOPE_ORDER],
            DATA_ISOTOPE_VIAL : [ID_ISOTOPE_VIAL],
          },self.admin
        )

    # Assert
    isotope_order.refresh_from_db()
    self.assertEqual(isotope_order.status, OrderStatus.Released)

  def test_releasing_isotope_order_without_data_errors_out(self):
    self.assertRaises(ContractBroken, self.db.release_isotope_order, {}, self.admin, self.now)
    self.assertRaises(ContractBroken, self.db.release_isotope_order, {
      DATA_ISOTOPE_ORDER : [], DATA_ISOTOPE_VIAL : []
    }, self.admin, self.now)

  def test_shop_users_cannot_release_orders(self):
    ID_ISOTOPE_ORDER = 67832945
    ID_ISOTOPE_VIAL = 67832946

    isotope_order = IsotopeOrder.objects.create(
      id=ID_ISOTOPE_ORDER,
      status=OrderStatus.Accepted,
      order_by=self.shop_external,
      ordered_activity_MBq=10000,
      destination=self.isotope_delivery,
      delivery_date=date(2025,5,11),
      freed_by=self.shop_admin,
      freed_datetime=datetime(2025,5,11,11,22,33,tzinfo=timezone.utc),
    )

    isotope_vial = IsotopeVial.objects.create(
      id=ID_ISOTOPE_VIAL,
      batch_nr="A17-251122-1",
      delivery_with=None, # This is the critical change
      volume=10.12,
      calibration_datetime=datetime(2025,5,11,10,10,33, tzinfo=timezone.utc),
      vial_activity=18592.104,
      isotope=self.isotope
    )

    # Act
    with self.assertLogs(ERROR_LOGGER):
      with self.assertNoLogs(AUDIT_LOGGER) as captured_audit_logs:
        self.assertRaises(ContractBroken, self.db.correct_order, {
            DATA_ISOTOPE_ORDER : [ID_ISOTOPE_ORDER],
            DATA_ISOTOPE_VIAL : [ID_ISOTOPE_VIAL],
          }, self.shop_admin
        )

    # Assert - No state changes
    isotope_order.refresh_from_db()
    self.assertEqual(isotope_order.status, OrderStatus.Accepted)

    isotope_vial.refresh_from_db()
    self.assertIsNone(isotope_vial.delivery_with)



  def test_releasing_isotope_order_with_invalid_state_errors_out(self):
    # Assemble
    ID_INVALID_ISOTOPE_ORDER = 67832945
    ID_VALID_ISOTOPE_ORDER = 67832947
    ID_INVALID_ISOTOPE_VIAL = 67832946
    ID_VALID_ISOTOPE_VIAL = 67832948

    invalid_isotope_order = IsotopeOrder.objects.create(
      id=ID_INVALID_ISOTOPE_ORDER,
      status=OrderStatus.Released,
      order_by=self.shop_external,
      ordered_activity_MBq=10000,
      destination=self.isotope_delivery,
      delivery_date=date(2025,5,11),
      freed_by=self.shop_admin,
      freed_datetime=datetime(2025,5,11,11,22,33,tzinfo=timezone.utc),
    )

    IsotopeOrder.objects.create(
      id=ID_VALID_ISOTOPE_ORDER,
      status=OrderStatus.Accepted,
      order_by=self.shop_external,
      ordered_activity_MBq=10000,
      destination=self.isotope_delivery,
      delivery_date=date(2025,5,11),
      freed_by=self.shop_admin,
      freed_datetime=datetime(2025,5,11,11,22,33,tzinfo=timezone.utc),
    )

    IsotopeVial.objects.create(
      id=ID_INVALID_ISOTOPE_VIAL,
      batch_nr="A17-251122-1",
      delivery_with=invalid_isotope_order,
      volume=10.12,
      calibration_datetime=datetime(2025,5,11,10,10,33, tzinfo=timezone.utc),
      vial_activity=18592.104,
      isotope=self.isotope
    )

    IsotopeVial.objects.create(
      id=ID_VALID_ISOTOPE_VIAL,
      batch_nr="A17-251122-1",
      delivery_with=None,
      volume=10.12,
      calibration_datetime=datetime(2025,5,11,10,10,33, tzinfo=timezone.utc),
      vial_activity=18592.104,
      isotope=self.isotope
    )

    # Act
    with self.assertLogs(ERROR_LOGGER):
      self.assertRaises(ContractBroken, self.db.release_isotope_order, {
        DATA_ISOTOPE_ORDER : [ID_INVALID_ISOTOPE_ORDER], DATA_ISOTOPE_VIAL : [ID_INVALID_ISOTOPE_VIAL]
      }, self.admin, self.now)
      self.assertRaises(ContractBroken, self.db.release_isotope_order, {
        DATA_ISOTOPE_ORDER : [ID_VALID_ISOTOPE_ORDER], DATA_ISOTOPE_VIAL : [ID_INVALID_ISOTOPE_VIAL]
      }, self.admin, self.now)
      self.assertRaises(ContractBroken, self.db.release_isotope_order, {
        DATA_ISOTOPE_ORDER : [ID_INVALID_ISOTOPE_ORDER], DATA_ISOTOPE_VIAL : [ID_VALID_ISOTOPE_VIAL]
      }, self.admin, self.now)

    # Assert
    # Well we already did that

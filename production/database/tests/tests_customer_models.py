"""Tests for database/TracershopModels/customerModels.py"""

# Python Standard library
from datetime import date, time, datetime, timezone

# Third party packages
from django.test import SimpleTestCase, TransactionTestCase

# Tracershop packages
from constants import AUDIT_LOGGER, DEBUG_LOGGER
from database.models import Days
from database.TracerShopModels.authModels import User, UserGroups
from database.TracerShopModels.clinicalModels import Tracer, Isotope, ActivityProduction, ReleaseRight, TracerTypes
from database.TracerShopModels.customerModels import *
from tracerauth.types import AuthActions

class SimpleCustomerModelTestCase(SimpleTestCase):
  def test_model_to_string_conversions(self):
    taylor = User(username="TaylorTheSlow")
    frank = Customer(short_name="FrankTheCustomer")
    franks_backyard = DeliveryEndpoint(name="franks backyard", owner=frank)
    the_secret_sauce=Tracer(shortname="secret sauce",
                            isotope=Isotope(atomic_letter="U",
                                            atomic_mass=235))
    franks_basement=Location(
      location_code="asdfqwer",
      endpoint = franks_backyard,
      common_name="franks basement"
    )
    franks_treatment_code=ProcedureIdentifier(
      code="zxcvqwer", description="franks treatment"
    )
    the_sauce_production=ActivityProduction(
      production_day=Days.Monday,
      tracer=the_secret_sauce,
      production_time=time(0,1,0),
    )
    the_sauce_delivery=ActivityDeliveryTimeSlot(
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_time=time(10,00,00),
      destination=franks_backyard,
      production_run=the_sauce_production,
    )
    the_sauce_order=ActivityOrder(
      ordered_activity=1e6,
      delivery_date=date(2012,1,12),
      status=OrderStatus.Accepted,
      comment=None,
      ordered_time_slot=the_sauce_delivery,
      ordered_by=taylor,
    )

    self.assertEqual(str(ClosedDate(close_date=date(2020,5,11))),
                     "Closed day at 2020-05-11")
    self.assertEqual(str(frank),
                     "FrankTheCustomer")
    self.assertEqual(str(UserAssignment(
      user=taylor,
      customer=frank
    )), "User: TaylorTheSlow is assigned to FrankTheCustomer")
    self.assertEqual(
      str(franks_backyard),
      "FrankTheCustomer - franks backyard"
    )
    self.assertEqual(str(
      TracerCatalogPage(
        endpoint=franks_backyard,
        tracer=the_secret_sauce
      )
    ),"FrankTheCustomer - franks backyard catalog secret sauce - U-235")
    self.assertEqual(
      str(Location(
        location_code="asdfqwer",
        endpoint = franks_backyard
      )), "Location: asdfqwer"
    )
    self.assertEqual(
      str(franks_basement), "Location: franks basement"
    )
    self.assertEqual(
      str(franks_basement), "Location: franks basement"
    )
    self.assertEqual(
      str(ProcedureIdentifier(code="hjlkyuoi")), "Procedure Identifier: hjlkyuoi"
    )
    self.assertEqual(
      str(franks_treatment_code), "Procedure Identifier: franks treatment"
    )
    self.assertEqual(
      str(Procedure(
        series_description=franks_treatment_code,
        tracer_units=300,
        delay_minutes=0,
        tracer=the_secret_sauce,
        owner=franks_backyard
      )), "Procedure: franks treatment for FrankTheCustomer - franks backyard"
    )
    self.assertEqual(
      str(Booking(
        status=BookingStatus.Initial,
        location=franks_basement,
        procedure=franks_treatment_code,
        accession_number="access",
        start_time=time(23,59,59),
        start_date=date(2020,5,11),
      )), "Booking: access"
    )
    self.assertEqual(
      str(the_sauce_delivery), "ActivityDeliveryTimeSlot at Monday - 10:00:00 to FrankTheCustomer"
    )
    self.assertEqual(
      str(Vial(
        tracer=the_secret_sauce,
        activity=1e6,
        volume=1e6,
        lot_number="SAUCE-200501",
        fill_time=time(0,0,30),
        fill_date=date(2020,5,1),
        assigned_to=None,
        owner=frank,
      )), "Vial - secret sauce - U-235 - FrankTheCustomer"
    )

    self.assertEqual(
      str(Vial(
        tracer=the_secret_sauce,
        activity=1e6,
        volume=1e6,
        lot_number="SAUCE-200501",
        fill_time=time(0,0,30),
        fill_date=date(2020,5,1),
        assigned_to=None,
        owner=None,
      )), "Vial - secret sauce - U-235 - (Missing)"
    )

    self.assertEqual(
      str(Vial(
        tracer=None,
        activity=1e6,
        volume=1e6,
        lot_number="SAUCE-200501",
        fill_time=time(0,0,30),
        fill_date=date(2020,5,1),
        assigned_to=None,
        owner=None,
      )), "Vial - (Missing) - (Missing)"
    )

    self.assertEqual(the_sauce_order.tracer, the_secret_sauce)

    # Access rights




class TransactionalCustomerModels(TransactionTestCase):
  def setUp(self) -> None:
    self.shop_user = User.objects.create(username="TaylorTheSlow", user_group=UserGroups.ShopUser)
    self.site_admin = User.objects.create(username="Mr gaga",      user_group=UserGroups.Admin)
    self.prod_admin = User.objects.create(username="Prof Dre",    user_group=UserGroups.ProductionAdmin)
    self.prod_user = User.objects.create(username="Scoop cat",  user_group=UserGroups.ProductionUser)
    self.frank = Customer.objects.create(short_name="FrankTheCustomer")
    self.franks_backyard = DeliveryEndpoint.objects.create(name="franks backyard", owner=self.frank)
    self.the_secret = Isotope.objects.create(atomic_letter="U", atomic_mass=235, atomic_number=92, halflife_seconds=57122)
    self.the_secret_sauce=Tracer.objects.create(shortname="secret sauce",
                                                isotope=self.the_secret,
                                                clinical_name="Boom stick fuel",
                                                tracer_type=TracerTypes.ActivityBased,
                                                vial_tag="FUN")
    self.the_sauce_production=ActivityProduction.objects.create(
      production_day=Days.Monday,
      tracer=self.the_secret_sauce,
      production_time=time(0,1,0),
    )
    self.the_sauce_delivery=ActivityDeliveryTimeSlot.objects.create(
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_time=time(10,00,00),
      destination=self.franks_backyard,
      production_run=self.the_sauce_production,
    )

  def tearDown(self):
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
    ReleaseRight.objects.all().delete()
    Tracer.objects.all().delete()
    Isotope.objects.all().delete()
    User.objects.all().delete()

  def test_ActivityOrder_can_xxx(self):
    the_ordered_sauce_order=ActivityOrder.objects.create(
      ordered_activity=1e6,
      delivery_date=date(2012,1,12),
      status=OrderStatus.Ordered,
      comment=None,
      ordered_time_slot=self.the_sauce_delivery,
      ordered_by=self.shop_user,
    )

    the_sauce_order=ActivityOrder.objects.create(
      ordered_activity=1e6,
      delivery_date=date(2012,1,12),
      status=OrderStatus.Accepted,
      comment=None,
      ordered_time_slot=self.the_sauce_delivery,
      ordered_by=self.shop_user,
    )
    # This is mostly just to capture the logs
    with self.assertLogs(AUDIT_LOGGER) as release_right_logs:
      self.rights = ReleaseRight(releaser=self.prod_user,
                               product=self.the_secret_sauce)
      self.rights.save(self.site_admin) # since you can't just create a right
    self.assertEqual(len(release_right_logs.output),1)

    the_finished_sauce_order=ActivityOrder.objects.create(
      ordered_activity=1e6,
      delivery_date=date(2012,1,12),
      status=OrderStatus.Released,
      comment=None,
      ordered_time_slot=self.the_sauce_delivery,
      ordered_by=self.shop_user,
      freed_by=self.prod_user,
      freed_datetime=datetime(2020,1,12,4,20,0, tzinfo=timezone.utc)
    )

    # Edit
    self.assertEqual(the_ordered_sauce_order.canEdit(self.shop_user), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(), AuthActions.REJECT)
    self.assertEqual(the_sauce_order.canEdit(self.shop_user), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(self.prod_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT)
    the_sauce_order.status = OrderStatus.Released
    self.assertEqual(the_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.prod_admin), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT_LOG)
    the_finished_sauce_order.status = OrderStatus.Accepted
    self.assertEqual(the_finished_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canEdit(self.prod_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT_LOG)

    # Create
    self.assertEqual(the_sauce_order.canCreate(), AuthActions.ACCEPT)

    # Delete
    self.assertEqual(the_ordered_sauce_order.canDelete(self.shop_user), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(), AuthActions.REJECT)
    self.assertEqual(the_sauce_order.canDelete(self.shop_user), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canDelete(self.site_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(self.prod_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(self.prod_user), AuthActions.ACCEPT)
    self.assertEqual(the_finished_sauce_order.canDelete(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canDelete(self.prod_admin), AuthActions.REJECT_LOG)
    self.assertEqual(the_finished_sauce_order.canDelete(self.prod_user), AuthActions.REJECT_LOG)


  def test_InjectionOrder_can_xxx(self):
    the_ordered_sauce_order = InjectionOrder.objects.create(
      delivery_time=time(1,2,3),
      delivery_date=date(2020,4,1),
      injections=1,
      status=OrderStatus.Ordered,
      tracer_usage=TracerUsage.human,
      comment="",
      ordered_by=self.shop_user,
      endpoint=self.franks_backyard,
      tracer=self.the_secret_sauce,
    )

    the_sauce_order = InjectionOrder.objects.create(
      delivery_time=time(1,2,3),
      delivery_date=date(2020,4,1),
      injections=1,
      status=OrderStatus.Accepted,
      tracer_usage=TracerUsage.human,
      comment="",
      ordered_by=self.shop_user,
      endpoint=self.franks_backyard,
      tracer=self.the_secret_sauce,
    )

    the_finished_sauce_order = InjectionOrder.objects.create(
      delivery_time=time(1,2,3),
      delivery_date=date(2020,4,1),
      injections=1,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.human,
      comment="",
      ordered_by=self.shop_user,
      endpoint=self.franks_backyard,
      tracer=self.the_secret_sauce,
      lot_number="FUN-200401-1",
      freed_datetime=datetime(2020,4,1,1,2,3,tzinfo=timezone.utc),
      freed_by=self.prod_user,
    )

    # This is mostly just to capture the logs
    with self.assertLogs(AUDIT_LOGGER) as release_right_logs:
      self.rights = ReleaseRight(releaser=self.prod_user,
                               product=self.the_secret_sauce)
      self.rights.save(self.site_admin) # since you can't just create a right
    self.assertEqual(len(release_right_logs.output),1)

    # Edit
    self.assertEqual(the_ordered_sauce_order.canEdit(self.shop_user), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(), AuthActions.REJECT)
    self.assertEqual(the_sauce_order.canEdit(self.shop_user), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(self.prod_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT)
    the_sauce_order.status = OrderStatus.Released
    self.assertEqual(the_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.prod_admin), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT_LOG)
    the_finished_sauce_order.status = OrderStatus.Accepted
    self.assertEqual(the_finished_sauce_order.canEdit(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canEdit(self.prod_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canEdit(self.prod_user), AuthActions.ACCEPT_LOG)

    # Create
    self.assertEqual(the_sauce_order.canCreate(), AuthActions.ACCEPT)

    # Delete
    self.assertEqual(the_sauce_order.canDelete(), AuthActions.REJECT)
    self.assertEqual(the_ordered_sauce_order.canDelete(self.shop_user), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(self.shop_user), AuthActions.REJECT_LOG)
    self.assertEqual(the_sauce_order.canDelete(self.site_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(self.prod_admin), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_order.canDelete(self.prod_user), AuthActions.ACCEPT)
    self.assertEqual(the_finished_sauce_order.canDelete(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_finished_sauce_order.canDelete(self.prod_admin), AuthActions.REJECT_LOG)
    self.assertEqual(the_finished_sauce_order.canDelete(self.prod_user), AuthActions.REJECT_LOG)

  def test_vial_can_XXXX(self):
    the_sauce_container = Vial()

    self.assertEqual(the_sauce_container.canCreate(), AuthActions.ACCEPT)
    self.assertEqual(the_sauce_container.canDelete(), AuthActions.REJECT)
    self.assertEqual(the_sauce_container.canEdit(), AuthActions.REJECT)

    self.assertEqual(the_sauce_container.canDelete(self.shop_user), AuthActions.REJECT)
    self.assertEqual(the_sauce_container.canDelete(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_container.canDelete(self.prod_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_container.canDelete(self.prod_user), AuthActions.ACCEPT_LOG)

    self.assertEqual(the_sauce_container.canEdit(self.shop_user), AuthActions.REJECT)
    self.assertEqual(the_sauce_container.canEdit(self.site_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_container.canEdit(self.prod_admin), AuthActions.ACCEPT_LOG)
    self.assertEqual(the_sauce_container.canEdit(self.prod_user), AuthActions.ACCEPT_LOG)

  def test_to_edit_injection_must_unrelease_it_first(self):
    inj = InjectionOrder.objects.create(
      id=690328,
      delivery_time=time(10,3,44),
      delivery_date=date(2011,7,11),
      injections=2,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.animal,
      comment="",
      ordered_by=self.shop_user,
      endpoint=self.franks_backyard,
      tracer=self.the_secret_sauce,
      lot_number="SECT-110711-1",
      freed_datetime=datetime(2011,7,11,9,55,11, tzinfo=timezone.utc),
      freed_by=self.prod_user,
    )

    inj.injections = 4
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.assertFalse(inj.save(self.site_admin))

    inj.status = OrderStatus.Accepted

    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.assertTrue(inj.save(self.site_admin))

  def test_shop_users_cant_delete_injection_orders(self):
    inj = InjectionOrder.objects.create(
      id=690328,
      delivery_time=time(10,3,44),
      delivery_date=date(2011,7,11),
      injections=2,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.animal,
      comment="",
      ordered_by=self.shop_user,
      endpoint=self.franks_backyard,
      tracer=self.the_secret_sauce,
      lot_number="SECT-110711-1",
      freed_datetime=datetime(2011,7,11,9,55,11, tzinfo=timezone.utc),
      freed_by=self.prod_user,
    )

    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.assertFalse(inj.delete(self.shop_user))

  def test_cant_delete_tracers_with_assigned_orders(self):
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.assertFalse(self.the_secret_sauce.delete(self.site_admin))

    # But we can delete fresh ones

    tracer = Tracer.objects.create(
      shortname="I have so much to live for",
      clinical_name="OOh noo, I just had my first kiss",
      isotope=self.the_secret,
      tracer_type=TracerTypes.InjectionBased,
      vial_tag=""
    )

    with self.assertNoLogs(AUDIT_LOGGER):
      self.assertTrue(tracer.delete(self.site_admin))

  def test_deleting_activity_production(self):
    with self.assertLogs(AUDIT_LOGGER) as captured_audit_logs:
      self.assertFalse(self.the_sauce_production.delete(self.site_admin))

    production = ActivityProduction.objects.create(
      production_day=Days.Friday,
      tracer=self.the_secret_sauce,
      production_time=time(11,00,00),
    )

    with self.assertNoLogs(AUDIT_LOGGER):
      self.assertTrue(production.delete(self.site_admin))

"""Tests for database/TracershopModels/customerModels.py"""

# Python Standard library
from datetime import date, time

# Third party packages
from django.test import SimpleTestCase, TransactionTestCase

# Tracershop packages
from database.models import Days
from database.TracerShopModels.authModels import User
from database.TracerShopModels.clinicalModels import Tracer, Isotope, ActivityProduction
from database.TracerShopModels.customerModels import *

class SimpleCustomerModelTestCase(SimpleTestCase):
  def test_model_to_string_conversions(self):
    taylor = User(username="TaylorTheSlow")
    frank = Customer(short_name="FrankTheCustomer")
    franks_backyard = DeliveryEndpoint(name="franks backyard", owner=frank)
    the_secret_sauce=Tracer(shortname="secret sauce", isotope=Isotope(atomic_letter="U",
                                                                      atomic_mass=235))
    franks_basement=Location(
      location_code="asdfqwer",
      endpoint = franks_backyard,
      common_name="franks basement")
    franks_treatment_code=ProcedureIdentifier(
      code="zxcvqwer", description="franks treatment"
    )
    the_sauce_production=ActivityProduction(
      production_day=Days.Monday,
      tracer=the_secret_sauce,
      production_time=time(0,1,0),
      expiration_date=None,
    )
    the_sauce_delivery=ActivityDeliveryTimeSlot(
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_time=time(10,00,00),
      destination=franks_backyard,
      production_run=the_sauce_production,
      expiration_date=None,
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
      )), "Vial -  - FrankTheCustomer"
    )
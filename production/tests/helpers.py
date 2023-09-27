"""This module contains helper function for initializing the test environment
This mostly consists of creating the database in a default, because tracershop
uses their database for configuration
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from asgiref.sync import sync_to_async
from pprint import pprint

# Third Party packages
import mysql.connector as mysql

# Tracershop Production Packages
from database.models import Address, Database, User, UserGroups, Isotope,\
    Tracer, ActivityDeliveryTimeSlot, ActivityProduction, Customer,\
    DeadlineTypes,DeliveryEndpoint, TracerTypes
#from database.production_database.SQLController import SQL
#from database.production_database.SQLExecuter import Fetching, ExecuteQuery

TEST_ADMIN_USERNAME = "test_admin"
TEST_ADMIN_PASSWORD = "test_admin_password"

TEST_PRODUCTION_USERNAME = "test_production"
TEST_PRODUCTION_PASSWORD = "test_production_password"


def InitializeTestDatabase():
  test_admin = User(id=1, username=TEST_ADMIN_USERNAME, user_group=UserGroups.Admin, OldTracerBaseID=1337)
  test_admin.set_password(TEST_ADMIN_PASSWORD)
  test_admin.save()

  test_production = User(id=2, username=TEST_PRODUCTION_USERNAME, user_group=UserGroups.ProductionAdmin, OldTracerBaseID=420)
  test_production.set_password(TEST_PRODUCTION_PASSWORD)
  test_production.save()


  isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
  isotope.save()

  tracer_activity = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=TracerTypes.ActivityBased,
      vial_tag=""
  )
  tracer_activity.save()

  tracer_injection = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=TracerTypes.InjectionBased,
      vial_tag=""
  )
  tracer_injection.save()

  production = ActivityProduction(
      tracer=tracer_activity,
      production_day = 0,
      production_time = "07:00:00",
    )
  production.save()

  customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
  customer.save()

  endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
  )
  endpoint.save()

  timeSlot_1 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production
  )
  timeSlot_1.save()

  timeSlot_2 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 8,
      weekly_repeat = 0,
      delivery_time = "11:30:00",
      destination=endpoint,
      production_run=production
  )
  timeSlot_2.save()

  return (isotope, tracer_activity, tracer_injection, production, customer, endpoint, timeSlot_1, timeSlot_2, test_admin, test_production)
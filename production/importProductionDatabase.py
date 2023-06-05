"""This scripts imports an old tracershop database into new tracershop database"""

__author__ = "Christoffer Vilstrup Jensen"

if __name__ != '__main__':
  raise Exception("This is a script not a module!")


import datetime
import mysql.connector as mysql
import django
import os
from typing import Dict, List

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()


from database.models import *


##### Script definitions #####
source_database = {
  'database' : "TS_test",
  'user' : "tracershop",
  'password' : "fdg4sale",
  'host' : "127.0.0.1",
  'port' : 5000
}


connection = mysql.connect(**source_database)
cursor = connection.cursor(dictionary=True) # type: ignore

cursor.execute("select name, halflife from isotopes")
isotopes_raw = cursor.fetchall()

defaultIsotope = None

# Defined tables:

for raw_isotope in isotopes_raw: # type: ignore
  name_split = raw_isotope['name'].split('-')
  atomicNumber = int(name_split[1].replace('m',''))

  isotope = Isotope(
    atomic_number = atomicNumber,
    atomic_letter = name_split[0],
    halflife_seconds=raw_isotope['halflife'],
    atomic_mass=1
  )

  isotope.save()

  if defaultIsotope is None:
    defaultIsotope = isotope

# Defined tables: Isotopes


cursor.execute("""SELECT
    id, name, isotope, n_injections, order_block, tracer_type, longName
  FROM
    Tracers""")
tracers_raw = cursor.fetchall()

fdg = None

tracers = {}
for raw_tracer in tracers_raw: #type: ignore

  tracer = Tracer(
    isotope=isotope, #type: ignore
    shortname = raw_tracer['name'],
    clinical_name = raw_tracer['longName'],
    vial_tag = "",
    tracer_type = TracerTypes.InjectionBased,
  )

  if tracer.shortname == "FDG":
    fdg = tracer
    tracer.tracer_type = TracerTypes.ActivityBased
  tracer.save()
  tracers[raw_tracer['id']] = tracer


# Defined tables: isotopes, tracers

def map_day(day):
  if day == 0:
    return Days.Monday
  if day == 1:
    return Days.Tuesday
  if day == 2:
    return Days.Wednesday
  if day == 4:
    return Days.Thursday
  if day == 5:
    return Days.Friday
  if day == 6:
    Days.Saturday
  return Days.Sunday


productions: Dict[Days, List] = {}

cursor.execute("SELECT day, ptime from productionTimes ORDER BY ptime")
for raw_production in cursor.fetchall(): # type: ignore
  day = map_day(raw_production['day']-1)

  print(type(raw_production['ptime']))

  production = ActivityProduction(
    tracer = fdg,
    production_day = day,
    production_time = raw_production['ptime']
  )

  if productions.get(day) is not None:
    productions[day].append(production)
  else:
    productions[day] = [production]
  production.save()

# Defined tables: isotopes, tracers, ActivityProduction

cursor.execute("""SELECT
    id, Username, Realname, tlf, kundenr, EMail, addr1, addr2, addr3, addr4
  FROM
    Users inner join UserRoles on Users.Id = UserRoles.Id_User
  WHERE UserRoles.Id_Role = 4""")
customers = {}
endpoints = {}

for raw_customer in cursor.fetchall(): # type: ignore
  customer = Customer(
    short_name = raw_customer['Username'],
    long_name = raw_customer['Realname'],
    dispenser_id = raw_customer['kundenr'],
    billing_address = raw_customer['addr1'],
    billing_city = raw_customer['addr2'],
  )

  customer.save()

  endpoint = DeliveryEndpoint(
    owner = customer,
    address = raw_customer['addr1'],
    name = raw_customer['Username'],
  )
  endpoint.save()

  customers[raw_customer['id']] = customer
  endpoints[raw_customer['id']] = endpoint
# Defined tables: isotopes, tracers, ActivityProduction, customers, endpoints

legacy_production_members = {}

cursor.execute("""SELECT
    Id, Username
  FROM
    Users
""")
for raw_production_member in cursor.fetchall(): # type:ignore
  lpm = LegacyProductionMember(
    legacy_user_id = raw_production_member['Id'],
    legacy_production_username = raw_production_member['Username']
  )
  lpm.save()
  legacy_production_members[raw_production_member] = lpm


cursor.execute("""SELECT
    tracer_id, customer_id
  FROM
    TracerCustomer
""")
for raw_tracer_customer in cursor.fetchall(): # type:ignore
  tracer = tracers[raw_tracer_customer['tracer_id']]
  customer = customers[raw_tracer_customer['customer_id']]
  tc = TracerCatalog(
    tracer = tracer,
    customer = customer
  )
  tc.save()



def map_repeat(repeat):
  if repeat == 1:
    return WeeklyRepeat.EveryWeek
  if repeat == 2:
    return WeeklyRepeat.EvenWeek

  return WeeklyRepeat.OddWeek

def get_production(day, production_time):
  prods = productions[day]
  prod = prods[0]

  if prod.production_time > production_time:
    prod[1]

  return prod


delivery_time_slots = {}

cursor.execute("""SELECT
    BID, day, dtime, repeat_t, run
  from deliverTimes
  ORDER BY BID, day, dtime
  """)
for raw_deliveryTime in cursor.fetchall(): # type: ignore
  endpoint = endpoints.get(raw_deliveryTime['BID'])
  if endpoint is None:
    print(f"Skipping BID {raw_deliveryTime['BID']}")
    continue
  day = map_day(raw_deliveryTime['day'])
  production = get_production(day, raw_deliveryTime['dtime'])
  delivery_time_slot = ActivityDeliveryTimeSlot(
    weekly_repeat = map_repeat(raw_deliveryTime['day']),
    endpoint = endpoint,
    tracer = fdg,
    delivery_time = raw_deliveryTime['dtime'],
    production_run = production,
  )

  delivery_time_slot.save()
  if raw_deliveryTime['BID'] in delivery_time_slot:
    daily_slots = {}
  else:
    daily_slots = {}
    delivery_time_slots[raw_deliveryTime['BID']] = daily_slots
  if day in daily_slots:
    daily_slots[day] = [delivery_time_slot]
  else:
    daily_slots[day].append(delivery_time_slot)


def map_status(status):
  if status == 1:
    return OrderStatus.Ordered
  if status == 2:
    return OrderStatus.Accepted
  if status == 3:
    return OrderStatus.Released
  return OrderStatus.Rejected


def map_anvendelse(usage):
  if usage == "Human":
    return TracerUsage.human
  if usage == "Dyr":
    return TracerUsage.animal
  return TracerUsage.other


cursor.execute("""SELECT
    BID, oid  deliver_datetime, status, batchnr, frigivet_datetime, frigivet_af,
    n_injections, anvendelse, tracer
  FROM
    t_orders
""")
for raw_t_order in cursor.fetchall(): #type: ignore
  delivery_datetime = datetime.datetime.strptime(raw_t_order['deliver_datetime'],"%Y-%m-%d %H:%M:%S")

  tracer = tracers.get(raw_t_order['tracer'])
  endpoint = endpoints.get(raw_t_order['BID'])
  if raw_t_order['frigivet_datetime'] != "0000-00-00 00:00:00":
    freed_datetime = datetime.datetime.strptime(raw_t_order['frigivet_datetime'],"%Y-%m-%d %H:%M:%S")
  else:
    freed_datetime = None

  injection_order = InjectionOrder(
    delivery_time = delivery_datetime.time(),
    delivery_date = delivery_datetime.date(),
    injections = raw_t_order['n_injections'],
    tracer_usage = map_anvendelse(raw_t_order['anvendelse']),
    freed_datetime = freed_datetime,
    endpoint = endpoint,
    status = map_status(raw_t_order['status']),
    batch_number = raw_t_order['batchnr'],
  )

  injection_order.save()

  if raw_t_order['status'] == 3:
    lio = LegacyInjectionOrder(
      legacy_order_id = raw_t_order['oid'],
      legacy_freed_id = legacy_production_members.get(raw_t_order['BID']),
      new_order_id = injection_order.injection_order_id
    )
    lio.save()


cursor.execute("""SELECT
    BID, OID, amount, deliver_datetime, status, frigivet_amount, frigivet_datetime, run, COID, frigivet_af, batchnr
  FROM
    orders
""")

for raw_order in cursor.fetchall(): #type:ignore
  delivery_datetime = datetime.datetime.strptime(raw_order['deliver_datetime'],"%Y-%m-%d %H:%M:%S")
  day = map_day(delivery_datetime.weekday)
  daily_slots = delivery_time_slots[raw_order['BID']]

  activity_delivery_time_slot = daily_slots[day][raw_order['run'] - 1]
  if raw_order['COID'] != -1:
    moved_time_slot = daily_slots[day][0]
  else:
    moved_time_slot = None
  freed_datetime = None
  if raw_order['status'] == 3:
    try:
      freed_datetime = datetime.datetime.strptime(raw_order['frigivet_datetime'],"%Y-%m-%d %H:%M:%S")
    except:
      pass

  ao = ActivityOrder(
    ordered_activity = raw_order['amount'],
    delivery_date = delivery_datetime.date(),
    status = map_status(raw_order['status']),
    #comment = ,
    ordered_time_slot = activity_delivery_time_slot,
    moved_to_time_slot= moved_time_slot,
    freed_datetime = freed_datetime,
  )

  ao.save()

  if raw_order['status'] == 3:
    lao = LegacyActivityOrder(
      legacy_order_id = raw_order['OID'],
      new_order_id = ao.activity_order_id,
      legacy_freed_id = raw_order['frigivet_af'],
      legacy_freed_amount = raw_order['frigivet_amount'],
      legacy_lot_number = raw_order['batchnr']
    )

    lao.save()

cursor.execute("""SELECT
    customer, charge, filldate, filltime, volume, activity
  FROM
    VAL
""")
for raw_vial in cursor.fetchall(): # type:ignore
  try:
    customer = Customer.objects.get(dispenser_id=raw_vial['customer'])
  except:
    customer = None

  vial = Vial(
    activity = raw_vial['activity'],
    volume = raw_vial['volume'],
    lot_number = raw_vial['charge'],
    owner = customer,
    fill_time = raw_vial['filltime'],
    fill_date = raw_vial['filldate']
  )
  vial.save()





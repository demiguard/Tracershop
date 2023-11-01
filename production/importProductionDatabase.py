"""This scripts imports an old tracershop database into new tracershop database"""

__author__ = "Christoffer Vilstrup Jensen"

if __name__ != '__main__':
  raise Exception("This is a script not a module!")

from pprint import pprint
import datetime
import mysql.connector as mysql
from mysql.connector.cursor import CursorBase
import django
import os
from typing import Any, Dict, List, Type, Iterable
from functools import reduce
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()


from django.utils import timezone

from database.models import * # type: ignore



##### Script definitions #####
source_database = {
  'database' : "TracerShop",
  'user' : "tracershop",
  'password' : "fdg4sale",
  'host' : "127.0.0.1",
  'port' : 5000
}

def get_conn_cursor():
  connection = mysql.connect(**source_database)
  cursor = connection.cursor(dictionary=True) # type: ignore

  return connection, cursor


def map_day(day):
  if day == 0:
    return Days.Monday
  if day == 1:
    return Days.Tuesday
  if day == 2:
    return Days.Wednesday
  if day == 3:
    return Days.Thursday
  if day == 4:
    return Days.Friday
  if day == 5:
    return Days.Saturday

  return Days.Sunday

def map_repeat(repeat):
  if repeat == 1:
    return WeeklyRepeat.EveryWeek
  if repeat == 2:
    return WeeklyRepeat.EvenWeek

  return WeeklyRepeat.OddWeek

def get_production(productions: Dict[Days, List[ActivityProduction]], 
                   day: Days,
                   production_time ) -> ActivityProduction :
  prods = productions[day]
  prod = prods[0]

  if prod.production_time > production_time:
    prod = prods[1]

  return prod

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

tz = timezone.get_current_timezone()


def get_isotopes(cursor: CursorBase) -> Dict[int, Isotope]:
  cursor.execute("select name, halflife,id from isotopes")
  isotopes_raw = cursor.fetchall()

  defaultIsotope = None

  # Defined tables:
  isotope_map = {}

  for raw_isotope in isotopes_raw: # type: ignore
    name_split = raw_isotope['name'].split('-')
    atomicMass = int(name_split[1].replace('m',''))

    isotope = Isotope(
      atomic_mass = atomicMass,
      atomic_letter = name_split[0],
      halflife_seconds=raw_isotope['halflife'],
      atomic_number=1
    )
    isotope.save()

    isotope_map[raw_isotope['id']] = isotope

    if defaultIsotope is None:
      defaultIsotope = isotope

  return isotope_map

def get_tracers(cursor: CursorBase, isotope_map) -> Tuple[Dict[int, Tracer], Tracer]:
  cursor.execute("""SELECT
    id, name, isotope, n_injections, order_block, tracer_type
  FROM
    Tracers""")
  tracers_raw = cursor.fetchall()

  fdg = None

  tracers = {}
  for raw_tracer in tracers_raw: #type: ignore
    isotope = isotope_map[raw_tracer['isotope']]
    tracer = Tracer(
      isotope=isotope, #type: ignore
      shortname = raw_tracer['name'],
      clinical_name = "",
      vial_tag = "",
      tracer_type = TracerTypes.InjectionBased,
    )

    if tracer.shortname == "FDG":
      fdg = tracer
      tracer.tracer_type = TracerTypes.ActivityBased

    tracer.save()
    tracers[raw_tracer['id']] = tracer
  return tracers, fdg # type: ignore

def get_productions(cursor:CursorBase, fdg: Tracer) -> Dict[Days, List[ActivityProduction]]:
  productions: Dict[Days, List[ActivityProduction]] = {}

  cursor.execute("SELECT day, ptime from productionTimes ORDER BY ptime")
  for raw_production in cursor.fetchall(): # type: ignore
    day = Days(raw_production['day']-1)

    production = ActivityProduction(
      tracer = fdg,
      production_day = day,
      production_time = str(raw_production['ptime'])
    )
    production.save()

    if day in productions:
      productions[day].append(production)
    else:
      productions[day] = [production]

  pprint(productions)
  return productions

def get_customers(cursor: CursorBase) -> Tuple[Dict[int, Customer], Dict[int, DeliveryEndpoint], Dict[int, float]]:
  cursor.execute("""SELECT
    id, Username, Realname, tlf, kundenr, EMail, addr1, addr2, addr3, addr4, overhead
  FROM
    Users inner join UserRoles on Users.Id = UserRoles.Id_User
  WHERE UserRoles.Id_Role = 4""")
  customers = {}
  endpoints = {}
  overheads = {}

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
    overheads[raw_customer['id']] = raw_customer['overhead']
  return customers, endpoints, overheads

def get_legacy_production(cursor: CursorBase) -> Dict[int, LegacyProductionMember]:
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
    legacy_production_members[raw_production_member['Id']] = lpm
  return legacy_production_members

def get_tracer_customer(cursor: CursorBase,
                        tracers: Dict[int, Tracer],
                        customers: Dict[int, Customer],
                        overheads: Dict[int, float],
                        fdg : Tracer) -> Dict[Tuple[int,int], TracerCatalogPage]:
  cursor.execute("""SELECT
    tracer_id, customer_id
  FROM
    TracerCustomer
  """)
  tracer_customer = {}

  for raw_tracer_customer in cursor.fetchall(): # type:ignore
    tracer = tracers[raw_tracer_customer['tracer_id']]
    customer = customers[raw_tracer_customer['customer_id']]
    tc = TracerCatalogPage(
      tracer = tracer,
      customer = customer
    )
    if (tracer.tracer_id, customer.customer_id) not in tracer_customer:
      tracer_customer[(tracer.tracer_id, customer.customer_id)] = tc

    try:
      tc.save()
    except:
      pass

  for customer_id, overhead in overheads.items():
    if overhead is None:
      multiplier = 1
    else:
      multiplier = 1 + overhead / 100

    customer = customers[customer_id]
    tc = TracerCatalogPage(
      tracer=fdg,
      customer=customer,
      overhead_multiplier=multiplier
    )

    tracer_customer[(fdg.tracer_id, customer.customer_id)] = tc
    try:
      tc.save()
    except:
      pass

  return tracer_customer

def get_activity_delivery_time_slots(cursor: CursorBase,
                                     endpoints: Dict[int, DeliveryEndpoint],
                                     productions: Dict[Days, List[ActivityProduction]]) -> Dict[int, Dict[Days, List[ActivityDeliveryTimeSlot]]]:
  delivery_time_slots: Dict[int, Dict[Days, List[ActivityDeliveryTimeSlot]]] = {}

  cursor.execute("""SELECT
      BID, day, dtime, repeat_t, run
    from deliverTimes
    ORDER BY BID, day, dtime
    """)
  for raw_deliveryTime in cursor.fetchall(): # type: ignore
    endpoint = endpoints.get(raw_deliveryTime['BID'])
    if endpoint is None:
      pprint(f"Skipping BID {raw_deliveryTime['BID']}")
      continue
    day = Days(raw_deliveryTime['day'] - 1)

    delivery_time = str(raw_deliveryTime['dtime'])

    production = get_production(productions, day, delivery_time)
    delivery_time_slot = ActivityDeliveryTimeSlot(
      weekly_repeat = map_repeat(raw_deliveryTime['repeat_t']),
      destination = endpoint,
      delivery_time = delivery_time,
      production_run = production,
    )
    delivery_time_slot.save()

    if raw_deliveryTime['BID'] in delivery_time_slots:
      daily_slots = delivery_time_slots[raw_deliveryTime['BID']]
    else:
      daily_slots = {}
      delivery_time_slots[raw_deliveryTime['BID']] = daily_slots
    if day in daily_slots:
      daily_slots[day].append(delivery_time_slot)
    else:
      daily_slots[day] = [delivery_time_slot]

  pprint(delivery_time_slots)
  return delivery_time_slots

def get_injections_orders(cursor: CursorBase,
                          legacy_production_members: Dict[int, LegacyProductionMember],
                          tracers: Dict[int, Tracer],
                          endpoints: Dict[int, DeliveryEndpoint]):
  injectionOrders = {}
  legacyInjectionOrders = {}
  cursor.execute("""SELECT
      BID, oid, deliver_datetime, status, batchnr, frigivet_datetime, frigivet_af,
      n_injections, anvendelse, tracer
    FROM
      t_orders
  """)
  for raw_t_order in cursor.fetchall(): #type: ignore
    delivery_datetime = raw_t_order['deliver_datetime']

    if delivery_datetime is None:
      continue

    tracer = tracers.get(raw_t_order['tracer'])
    endpoint = endpoints.get(raw_t_order['BID'])
    if raw_t_order['frigivet_datetime'] != "0000-00-00 00:00:00":
      freed_datetime = raw_t_order['frigivet_datetime']
    else:
      freed_datetime = None
    if freed_datetime is not None:
      freed_datetime = freed_datetime.replace(tzinfo=tz)

    injection_order = InjectionOrder(
      delivery_time = delivery_datetime.time(),
      delivery_date = delivery_datetime.date(),
      injections = raw_t_order['n_injections'],
      status = map_status(raw_t_order['status']),
      tracer_usage = map_anvendelse(raw_t_order['anvendelse']),
      comment=None,
      ordered_by=None,
      endpoint = endpoint,
      tracer = tracer,
      lot_number = raw_t_order['batchnr'],
      freed_datetime = freed_datetime,
      freed_by=None,
    )
    injection_order.save()

    injectionOrders[raw_t_order['oid']] = injection_order

    if injection_order.lot_number != raw_t_order['batchnr']:
      print("DATA CORRUPTION! - Injection Order")
      print(raw_t_order)

    if raw_t_order['status'] == 3:
      lio = LegacyInjectionOrder(
        legacy_order_id = raw_t_order['oid'],
        legacy_freed_id = legacy_production_members.get(raw_t_order['BID']),
        new_order_id = injection_order
      )
      lio.save()
      legacyInjectionOrders[raw_t_order['oid']] = lio

  return injectionOrders, legacyInjectionOrders

def get_activityOrders(cursor: CursorBase,
                       delivery_time_slots: Dict[int, Dict[Days, List[ActivityDeliveryTimeSlot]]],
                       legacy_production_members: Dict[int, LegacyProductionMember]) -> Tuple[Dict[int, ActivityOrder], Dict[int, LegacyActivityOrder]]:
  activityOrders = {}
  legacyActivityOrders = {}

  cursor.execute("""SELECT
    BID, OID, amount, deliver_datetime, status, frigivet_amount, frigivet_datetime, run, COID, frigivet_af, batchnr
  FROM
    orders
  """)
  for raw_order in cursor.fetchall(): #type:ignore
    delivery_datetime:datetime.datetime = raw_order['deliver_datetime']
    delivery_datetime.replace(tzinfo=tz)

    day = Days(delivery_datetime.weekday())
    daily_slots = delivery_time_slots[raw_order['BID']]
    if day in daily_slots:
      time_slots = daily_slots[day]
    else:
      print("Could not find ")
      continue

    if raw_order['run'] - 1 < len(time_slots):
      activity_delivery_time_slot = time_slots[raw_order['run'] - 1]
    else:
      activity_delivery_time_slot = time_slots[0] # This a known problem

    try:
      if raw_order['COID'] != -1:
        activity_delivery_time_slot = daily_slots[day][1]
        moved_time_slot = daily_slots[day][0]
      else:
        moved_time_slot = None
    except:
      moved_time_slot = None
    if raw_order['status'] == 3:
      try:
        freed_datetime = raw_order['frigivet_datetime']
        freed_datetime = freed_datetime.replace(tzinfo=tz)
      except:
        freed_datetime = None
        pass
    else:
      freed_datetime = None

    if Days(activity_delivery_time_slot.production_run.production_day) != Days(delivery_datetime.weekday()):
      print("DATA CORRUPTION! - Activity Order - Date does not match!")
      pprint(raw_order)
      pprint(delivery_datetime)
      pprint(day)
      pprint(daily_slots)
      pprint(time_slots)
      pprint(activity_delivery_time_slot)
      pprint(activity_delivery_time_slot.production_run)
      pprint(activity_delivery_time_slot.production_run.production_day)
      pprint(moved_time_slot)
      exit(1)

    ao = ActivityOrder(
      ordered_activity = raw_order['amount'],
      delivery_date = delivery_datetime.date(),
      status = map_status(raw_order['status']),
      comment = None,
      ordered_time_slot = activity_delivery_time_slot,
      moved_to_time_slot= moved_time_slot,
      freed_datetime = freed_datetime,
      ordered_by=None,
      freed_by=None,
    )
    ao.save()

    if raw_order['status'] == 3 and raw_order['frigivet_af'] is not None:
      if raw_order['frigivet_af'] not in legacy_production_members:
        continue
      legacy_user = legacy_production_members[raw_order['frigivet_af']]

      lao = LegacyActivityOrder(
        legacy_order_id = raw_order['OID'],
        new_order_id = ao,
        legacy_freed_id = legacy_user,
        legacy_freed_amount = raw_order['frigivet_amount'],
        legacy_lot_number = raw_order['batchnr']
      )
      legacyActivityOrders[raw_order['OID']] = lao
      lao.save()

  return activityOrders, legacyActivityOrders

def get_vials(cursor: CursorBase):
  vials = {}
  cursor.execute("""SELECT
      ID ,customer, charge, filldate, filltime, volume, activity
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
      fill_time = str(raw_vial['filltime']),
      fill_date = str(raw_vial['filldate'])
    )
    try:
      vial.save()
    except:
      print("Skipping Vial")
      continue
    vials[raw_vial['ID']] = vial
  return vials

def bulk_create(model: Type[T], models: Iterable[T]):
  model.objects.bulk_create(models)

def bulk_create_list(model: Type[T], models: Iterable[List[T]]):
  mega_models = reduce(lambda x,y: x+y, models, [])

  model.objects.bulk_create(mega_models)

def save_models(model_map: Dict[Any, T]):
  [model.save() for model in model_map.values()]

def save_list_models(model_map: Dict[Any, List[T]]):
  [[model.save() for model in model_list] for model_list in model_map.values()]

if __name__ == '__main__':
  connection = mysql.connect(**source_database)
  cursor: CursorBase = connection.cursor(dictionary=True) # type: ignore
  isotope_map = get_isotopes(cursor)
  #save_models(isotope_map)
  tracer_map, fdg = get_tracers(cursor, isotope_map)
  #save_models(isotope_map)
  production_map = get_productions(cursor, fdg)
  #save_list_models(production_map)

  customer_map, endpoint_map, overhead = get_customers(cursor)
  #save_models(customer_map)
  #save_models(endpoint_map)

  legacy_production_members = get_legacy_production(cursor)
  #bulk_create(LegacyProductionMember, legacy_production_members.values())
  tracer_customer = get_tracer_customer(cursor, tracer_map, customer_map,overhead, fdg)
  #save_models(tracer_customer)
  activityDeliveryTimeSlots = get_activity_delivery_time_slots(cursor, endpoint_map, production_map)

  injection_orders_map, legacy_injection_order = get_injections_orders(cursor, legacy_production_members, tracer_map, endpoint_map)
  #save_models(injection_orders_map)
  #save_models(legacy_injection_order)

  activity_order_map, legacy_activity_order_map = get_activityOrders(cursor, activityDeliveryTimeSlots, legacy_production_members)

  vials = get_vials(cursor)
  #save_models(vials)
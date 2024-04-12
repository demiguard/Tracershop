from datetime import datetime
from typing import List, Tuple, Type

# Third party packages
from django.utils import timezone

# Tracershop Packages
from data_scripts.mapping import get_endpoint_for_cid
from database.models import TracershopModel, ActivityOrder, Tracer, OrderStatus, ActivityDeliveryTimeSlot, ActivityProduction


fdg = Tracer.objects.get(shortname="FDG")

prods = {
  k : ActivityProduction.objects.filter(production_day=k, tracer=fdg) for k in range(7)
}


def parse_activity(line: str):
  BID,OID,order_time,amount,deliver_datetime,status,received_datetime,batchnr,\
    run,COID,total_amount,frigivet_amount,frigivet_datetime,amount_o,\
    total_amount_o,price,frigivet_af,tracer,volume,doser,dose_counter,\
    comment,userName = line.split(',')

  endpoint = get_endpoint_for_cid(int(BID))
  deliver_dt = datetime.strptime(deliver_datetime, "%Y-%m-%d %H:%M:%S")
  deliver_dt.replace(tzinfo=timezone.get_current_timezone())
  if frigivet_datetime != "NULL" and (not frigivet_datetime.startswith("0000")):
    freed_dt = datetime.strptime(frigivet_datetime, "%Y-%m-%d %H:%M:%S")
    freed_dt.replace(tzinfo=timezone.get_current_timezone())
  else:
    freed_dt = None

  adts = ActivityDeliveryTimeSlot.objects.get(
    destination=endpoint,
    delivery_time=deliver_dt.time(),
    production_run__in=prods[deliver_dt.weekday()]
  )

  return ActivityOrder(
    ordered_activity = float(amount),
    delivery_date = deliver_dt.date(),
    status=OrderStatus(int(status)),
    comment=None,
    ordered_time_slot=adts,
    moved_to_time_slot=None,
    freed_datetime=freed_dt,
    freed_by=None,
  )

def parse_activity_orders(file_content: List[str]) -> Tuple[
                                                        List[TracershopModel],
                                                        Type[TracershopModel]]:

  activity_orders = []

  for activity_line in file_content:
    activity = parse_activity(activity_line)
    activity_orders.append(activity)

  return activity_orders, ActivityOrder

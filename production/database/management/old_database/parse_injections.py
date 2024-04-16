# Python Standard library
from typing import List
from datetime import datetime

# Third party packages
from django.utils import timezone

# Tracershop packages
from data_scripts.mapping import get_endpoint_for_cid, tracer_mapping
from database.models import InjectionOrder, OrderStatus, TracerUsage,\
  TracershopModel

def mapUsage(usage: str):
  if usage == "Human":
    return TracerUsage.human
  if usage == "Dyr":
    return TracerUsage.animal
  if usage.lower() == "andet":
    return TracerUsage.other

  raise Exception(usage)


def parse_injection(inj_line:str):
  BID,OID,order_time,deliver_datetime,status,received_datetime,batchnr,run,\
    COID,frigivet_amount,frigivet_datetime,price,frigivet_af,tracer,volume,\
    n_injections,anvendelse,comment,userName = inj_line.split(',')

  deliver_dt = datetime.strptime(deliver_datetime, "%Y-%m-%d %H:%M:%S")
  deliver_dt.replace(tzinfo=timezone.get_current_timezone())
  endpoint = get_endpoint_for_cid(int(BID))
  tracer = tracer_mapping.get(int(tracer))

  return InjectionOrder(
    delivery_time=deliver_dt.time(),
    delivery_date=deliver_dt.date(),
    injections=int(n_injections),
    status=OrderStatus(int(status)),
    tracer_usage=mapUsage(anvendelse),
    comment=None,
    ordered_by=None,
    endpoint=endpoint,
    tracer=tracer,
    lot_number=None,
    freed_datetime=None,
    freed_by=None,
  )

def parse_injections(file_content: List[str]) -> List[TracershopModel]:
  injection_orders = []
  for inj_line in file_content:
    injection = parse_injection(inj_line)
    injection_orders.append(injection)

  return injection_orders, InjectionOrder

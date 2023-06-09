"""This module is all about placing orders"""

# Python Standard Library
from datetime import datetime, timedelta
from typing import Callable, Dict, List, Tuple

# Thrid Party Packages
from django.db.models.query import QuerySet
from channels.db import database_sync_to_async

# Tracershop Packages
from database.models import ActivityDeliveryTimeSlot, ActivityOrder,\
    ActivityProduction, Booking, BookingStatus, DeliveryEndpoint,\
    InjectionOrder, TracerUsage,\
    OrderStatus, Tracer, TracerTypes, TracershopModel, User
from lib.calenderHelper import subtract_times
from lib.physics import tracerDecayFactor

def __createInjectionOrdersToBookings(tracer: Tracer,
                                      bookings: QuerySet[Booking],
                                      user: User) -> List[TracershopModel]:
  orders = []
  for booking in bookings:
    booking.status = BookingStatus.Ordered
    procedure = booking.procedure
    endpoint = booking.location.endpoint
    orders.push(InjectionOrder(
      delivery_time=booking.start_time,
      delivery_date=booking.start_date,
      status=OrderStatus.Ordered,
      tracer_usage = TracerUsage.human,
      injections=procedure.tracer_units,
      ordered_by=user,
      endpoint=endpoint,
      tracer=tracer
    ))
  InjectionOrder.objects.bulk_create(orders)
  return orders

def __createActivityOrdersToBookings(tracer: Tracer, bookings: QuerySet[Booking], user: User):
  amounts: Dict[ActivityDeliveryTimeSlot, float] = {}
  booking = bookings[0] # Len == 0 raise key error
  productions = ActivityProduction.objects.filter(
          production_day=booking.start_date.weekday(),
          tracer=tracer
        )

  for booking in bookings:
    procedure = booking.procedure
    endpoint = booking.location.endpoint
    activity_delivery_timeslots = ActivityDeliveryTimeSlot.objects.filter(
            production_run__in=productions,
            tracer=tracer,
            destination=endpoint,)
    order_time = booking.start_time + timedelta(minutes=procedure.delay_minutes)

    closest_timeslot = None
    smallest_time_delta = None
    # Select the clostest time slot to the booking time
    for activity_delivery_timeslot in activity_delivery_timeslots:
      time_difference = subtract_times(order_time, activity_delivery_timeslot.delivery_time)
      if time_difference.days < 0:
        continue

      if activity_delivery_timeslot is None and smallest_time_delta is None:
        closest_timeslot = activity_delivery_timeslot
        smallest_time_delta = time_difference
      elif smallest_time_delta > time_difference:
        closest_timeslot = activity_delivery_timeslot
        smallest_time_delta = time_difference
    # End of closet time selection

    if closest_timeslot is None:
      raise Exception

    tracer_units = procedure.tracer_units / tracerDecayFactor(smallest_time_delta.seconds)
    if endpoint in amounts:
      amounts[endpoint] += tracer_units
    else:
      amounts[endpoint] = tracer_units

    booking.status = BookingStatus.Ordered
  # End of Booking Iteration
  orders = []
  for activity_delivery_timeslot, amount in amounts.items():
    orders.push(ActivityOrder(
      ordered_activity = amount,
      delivery_date = booking.start_date,
      status = OrderStatus.Ordered,
      ordered_time_slot = activity_delivery_timeslot,
      ordered_by = user,
    ))
  ActivityOrder.objects.bulk_create(orders)
  return orders



@database_sync_to_async
def canOrder(reference: datetime, tracer: Tracer) -> bool:
  return True

@database_sync_to_async
def orderBookings(tracer: Tracer, booking_ids: List[int], user: User) -> Tuple[QuerySet[Booking], ]:
  bookings = Booking.objects.filter(pk__in=booking_ids)
  handler = __order_handler_functions.get(tracer.tracer_type)
  if handler is None:
    raise Exception

  orders = handler(tracer, bookings, user)
  Booking.objects.bulk_update(bookings, ['status'])

  return bookings, orders


__order_handler_functions: Dict[TracerTypes, Callable[[Tracer, QuerySet[Booking], User], List[TracershopModel]]] = {
  TracerTypes.ActivityBased : __createActivityOrdersToBookings,
  TracerTypes.InjectionBased : __createInjectionOrdersToBookings,
}
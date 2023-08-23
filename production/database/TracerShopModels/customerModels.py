"""This module contains information about the customers models of tracershop
It belongs here if it's related to a Customer.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library

# Third Party Packages
from django.db.models import Model, DateField, BigAutoField, CharField, EmailField, TextField, IntegerField, FloatField, ForeignKey, SmallIntegerField, RESTRICT, CASCADE, IntegerChoices, BooleanField, TimeField, DateTimeField, SET_NULL, PositiveSmallIntegerField, BigIntegerField, Index

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel
from database.TracerShopModels.authModels import User
from database.TracerShopModels.clinicalModels import ActivityProduction, Tracer


class ClosedDate(TracershopModel):
  close_date_id = BigAutoField(primary_key=True)
  close_date = DateField()

  class Meta:
    indexes = [
      Index(fields=['close_date'])
    ]


class Customer(TracershopModel):
  """This represents the organization that is ordering tracers in tracershop"""
  customer_id = BigAutoField(primary_key=True)
  short_name = CharField(max_length=32)
  long_name = CharField(max_length=128, null=True, default=None)
  dispenser_id = SmallIntegerField(null=True, default=None)
  billing_address = CharField(max_length=128, null=True, default=None)
  billing_city = CharField(max_length=128, null=True, default=None)
  billing_email = EmailField(max_length=128, null=True, default=None)
  billing_phone = CharField(max_length=32, null=True, default=None)
  billing_zip_code = CharField(max_length=8, null=True, default=None)
  active_directory_code = CharField(max_length=128, null=True, default=None)


class TracerCatalog(TracershopModel):
  tracer_catalog_id = BigAutoField(primary_key=True)
  customer = ForeignKey(Customer, on_delete=RESTRICT)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  max_injections = SmallIntegerField(default=0)
  overhead_multiplier = FloatField(default=1)

  class Meta:
    unique_together = ('customer', 'tracer')


class UserAssignment(TracershopModel):
  user_assignment_id = BigAutoField(primary_key=True)
  user = ForeignKey(User, on_delete=CASCADE)
  customer = ForeignKey(Customer, on_delete=RESTRICT)

  class Meta:
    unique_together = ('user', 'customer')


class Message(TracershopModel):
  message_id = BigAutoField(primary_key=True)
  message = TextField(max_length=8000)
  expiration = DateField(null=True, default=None)


class MessageAssignment(TracershopModel):
  message_assignment_id = BigAutoField(primary_key=True)
  message_id = ForeignKey(Message, on_delete=CASCADE)
  customer_id = ForeignKey(Customer, on_delete=RESTRICT)

  class Meta:
    unique_together = ('message_id', 'customer_id')


class DeliveryEndpoint(TracershopModel):
  tracer_endpoint_id = BigAutoField(primary_key=True)
  address = CharField(max_length=128, null=True, default=None)
  city = CharField(max_length=128, null=True, default=None)
  zip_code = CharField(max_length=8, null=True, default=None)
  phone = CharField(max_length=32, null=True, default=None)
  name = CharField(max_length=32, null=True, default=None)
  owner = ForeignKey(Customer, on_delete=RESTRICT)


class Location(TracershopModel):
  """This is a room, that can be booked too. A room can be owned by an endpoint
  """
  #Note A Location should be able to be created from location_code alone
  location_id = BigAutoField(primary_key=True)
  location_code = CharField(max_length=120)
  endpoint = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT, null=True, default=None)
  common_name = CharField(max_length=120, null=True, default=None)

class ProcedureIdentifier(TracershopModel):
  procedure_identifier_id = BigAutoField(primary_key=True)
  string = CharField(max_length=128)


class Procedure(TracershopModel):
  procedure_id = BigAutoField(primary_key=True)
  series_description = ForeignKey(ProcedureIdentifier, on_delete=RESTRICT, default=None, null=True)
  tracer_units = FloatField(default=0.0)
  delay_minutes = FloatField(default=0.0)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT, default=None, null=True)
  owner = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT, default=None, null=True)

  class Meta:
    unique_together = ('series_description', 'owner')


class BookingStatus(IntegerChoices):
  Initial = 0
  Ordered = 1
  Rejected = 2
  Released = 3

class Booking(TracershopModel):
  booking_id = BigAutoField(primary_key=True)
  status = SmallIntegerField(choices=BookingStatus.choices, default=BookingStatus.Initial)
  location = ForeignKey(Location, on_delete=RESTRICT)
  procedure = ForeignKey(ProcedureIdentifier, on_delete=RESTRICT)
  accession_number = CharField(max_length=32)
  start_time = TimeField()
  start_date = DateField()


class WeeklyRepeat(IntegerChoices):
  EveryWeek = 0
  EvenWeek = 1
  OddWeek = 2


class ActivityDeliveryTimeSlot(TracershopModel):
  activity_delivery_time_slot_id = BigAutoField(primary_key=True)
  weekly_repeat = SmallIntegerField(choices=WeeklyRepeat.choices)
  delivery_time = TimeField()
  destination = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT)
  production_run = ForeignKey(ActivityProduction, on_delete=RESTRICT)
  expiration_date = DateField(null=True, default=None)

  def __str__(self) -> str:
    return f"ActivityDeliveryTimeSlot at {self.production_run.production_day} - {self.delivery_time} to {self.destination.owner.short_name}"


class OrderStatus(IntegerChoices):
  Ordered = 1
  Accepted = 2
  Released = 3
  Rejected = 4

class ActivityOrder(TracershopModel):
  activity_order_id = BigAutoField(primary_key=True)
  ordered_activity = FloatField()
  delivery_date = DateField()
  status = SmallIntegerField(choices=OrderStatus.choices)
  comment = CharField(max_length=800, null=True, default=None)
  ordered_time_slot = ForeignKey(
    ActivityDeliveryTimeSlot, on_delete=RESTRICT, related_name="ordered")

  moved_to_time_slot = ForeignKey(
    ActivityDeliveryTimeSlot,
    on_delete=RESTRICT,
    default=None,
    null=True,
    related_name="moved_to"
  )
  freed_datetime = DateTimeField(null=True, default=None)
  ordered_by = ForeignKey(
    User,
    on_delete=SET_NULL,
    null=True,
    default=None,
    related_name="activity_ordered_by"
  )
  freed_by = ForeignKey(
    User,
    on_delete=RESTRICT,
    null=True,
    default=None,
    related_name="activity_freed_by"
  )

  class Meta:
    indexes = [
      Index(fields=['delivery_date'])
    ]

class TracerUsage(IntegerChoices):
  human = 0
  animal = 1
  other = 2

class InjectionOrder(TracershopModel):
  injection_order_id = BigAutoField(primary_key=True)
  delivery_time = TimeField()
  delivery_date = DateField()
  injections = PositiveSmallIntegerField()
  status = SmallIntegerField(choices=OrderStatus.choices)
  tracer_usage = SmallIntegerField(choices=TracerUsage.choices)
  comment = CharField(max_length=800, null=True, default=None)
  ordered_by = ForeignKey(User, on_delete=SET_NULL, null=True, default=None, related_name="injection_ordered_by")
  endpoint = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  lot_number = CharField(max_length=32, null=True, default=None)
  freed_datetime = DateTimeField(null=True, default=None)
  freed_by = ForeignKey(User, on_delete=RESTRICT, null=True, default=None, related_name="injection_freed_by")

  class Meta:
    indexes = [
      Index(fields=['delivery_date'])
    ]


class Vial(TracershopModel):
  vial_id = BigAutoField(primary_key=True)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT, null=True)
  activity = FloatField()
  volume = FloatField()
  lot_number = CharField(max_length=32)
  fill_time = TimeField()
  fill_date = DateField()
  assigned_to = ForeignKey(ActivityOrder, on_delete=RESTRICT, null=True, default=None)
  owner = ForeignKey(Customer, on_delete=RESTRICT, null=True, default=None)

  class Meta:
    indexes = [
      Index(fields=['fill_date'])
    ]

class LegacyProductionMember(TracershopModel):
  legacy_user_id = IntegerField(primary_key=True)
  legacy_production_username = CharField(max_length=50)

class LegacyInjectionOrder(TracershopModel):
  legacy_order_id = IntegerField(primary_key=True)
  new_order_id = ForeignKey(InjectionOrder, on_delete=RESTRICT)
  legacy_freed_id = ForeignKey(LegacyProductionMember, on_delete=RESTRICT)

class LegacyActivityOrder(TracershopModel):
  legacy_order_id = IntegerField(primary_key=True)
  new_order_id = ForeignKey(ActivityOrder, on_delete=RESTRICT)
  legacy_freed_id = ForeignKey(LegacyProductionMember, on_delete=RESTRICT)
  legacy_freed_amount = FloatField(null=True, default=None)
  legacy_lot_number = CharField(max_length=32)

"""This module contains information about the customers models of tracershop
It belongs here if it's related to a Customer.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library

# Third Party Packages
from typing import Optional
from django.db.models import DateField, BigAutoField, CharField, EmailField,\
    TextField, Index, IntegerField, FloatField, ForeignKey, SmallIntegerField,\
    RESTRICT, CASCADE, IntegerChoices, BooleanField, TimeField, DateTimeField,\
    SET_NULL, PositiveSmallIntegerField, BigIntegerField, Index

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel, Days
from database.TracerShopModels.authModels import User
from database.TracerShopModels.clinicalModels import ActivityProduction, Tracer, ReleaseRight
from database.TracerShopModels import authModels
from tracerauth.types import AuthActions


class ClosedDate(TracershopModel):
  id = BigAutoField(primary_key=True)
  close_date = DateField()

  def __str__(self) -> str:
    return f"Closed day at {self.close_date}"

  class Meta:
    indexes = [
      Index(fields=['close_date'])
    ]


class Customer(TracershopModel):
  """This represents the organization that is ordering tracers in tracershop"""
  id = BigAutoField(primary_key=True)
  short_name = CharField(max_length=32)
  long_name = CharField(max_length=128, null=True, default=None)
  dispenser_id = SmallIntegerField(null=True, default=None, unique=True)
  billing_address = CharField(max_length=128, null=True, default=None)
  billing_city = CharField(max_length=128, null=True, default=None)
  billing_email = EmailField(max_length=128, null=True, default=None)
  billing_phone = CharField(max_length=32, null=True, default=None)
  billing_zip_code = CharField(max_length=8, null=True, default=None)
  active_directory_code = CharField(max_length=128, null=True, default=None)

  def __str__(self) -> str:
    return self.short_name

class UserAssignment(TracershopModel):
  id = BigAutoField(primary_key=True)
  user = ForeignKey(User, on_delete=CASCADE)
  customer = ForeignKey(Customer, on_delete=RESTRICT)

  def __str__(self) -> str:
    return f"User: {self.user} is assigned to {self.customer}"

  class Meta:
    unique_together = ('user', 'customer')


class Message(TracershopModel):
  id = BigAutoField(primary_key=True)
  message = TextField(max_length=8000)
  expiration = DateField(null=True, default=None)


class MessageAssignment(TracershopModel):
  id = BigAutoField(primary_key=True)
  message_id = ForeignKey(Message, on_delete=CASCADE)
  customer_id = ForeignKey(Customer, on_delete=RESTRICT)

  class Meta:
    unique_together = ('message_id', 'customer_id')


class DeliveryEndpoint(TracershopModel):
  id = BigAutoField(primary_key=True)
  address = CharField(max_length=128, null=True, default=None)
  city = CharField(max_length=128, null=True, default=None)
  zip_code = CharField(max_length=8, null=True, default=None)
  phone = CharField(max_length=32, null=True, default=None)
  name = CharField(max_length=32, null=True, default=None)
  owner = ForeignKey(Customer, on_delete=RESTRICT)

  def __str__(self) -> str:
    return f"{self.owner} - {self.name}"

class TracerCatalogPage(TracershopModel):
  id = BigAutoField(primary_key=True)
  endpoint = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  max_injections = SmallIntegerField(default=0)
  overhead_multiplier = FloatField(default=1)

  def __str__(self) -> str:
    return f"{self.endpoint} catalog {self.tracer}"

  class Meta:
    unique_together = ('endpoint', 'tracer')


class Location(TracershopModel):
  """This is a room, that can be booked too. A room can be owned by an endpoint
  """
  #Note A Location should be able to be created from location_code alone
  id = BigAutoField(primary_key=True)
  location_code = CharField(max_length=120, unique=True)
  endpoint = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT, null=True, default=None)
  common_name = CharField(max_length=120, null=True, default=None)

  def __str__(self) -> str:
    baseString = "Location: "
    if self.common_name is not None:
      return baseString + " " + self.common_name
    else:
      return baseString + " " + self.location_code


class ProcedureIdentifier(TracershopModel):
  id = BigAutoField(primary_key=True)
  code = CharField(max_length=128, blank=True, unique=True, null=True, default=None)
  description = CharField(max_length=255, blank=True, unique=True, null=True, default=None)
  is_pet = BooleanField(default=False)

  def __str__(self) -> str:
    baseString = "Procedure Identifier: "
    if self.description is not None:
      return baseString + " " + self.description
    else:
      return baseString + " " + self.code


class Procedure(TracershopModel):
  id = BigAutoField(primary_key=True)
  series_description = ForeignKey(ProcedureIdentifier, on_delete=RESTRICT)
  tracer_units = FloatField(default=0.0)
  delay_minutes = FloatField(default=0.0)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  owner = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT)

  def __str__(self) -> str:
    series_description = "(Missing)"
    if self.series_description is not None and self.series_description.description is not None:
      series_description = self.series_description.description

    owner = "(Missing)"
    if self.owner:
      owner = str(self.owner)

    return f"Procedure: {series_description} for {owner}"

  class Meta:
    unique_together = ('series_description', 'owner')


class BookingStatus(IntegerChoices):
  Initial = 0
  Ordered = 1
  Rejected = 2
  Released = 3

class Booking(TracershopModel):
  id = BigAutoField(primary_key=True)
  status = SmallIntegerField(choices=BookingStatus.choices, default=BookingStatus.Initial)
  location = ForeignKey(Location, on_delete=RESTRICT)
  procedure = ForeignKey(ProcedureIdentifier, on_delete=RESTRICT)
  accession_number = CharField(max_length=32, unique=True, blank=True, null=True, default=None)
  start_time = TimeField()
  start_date = DateField()

  def __str__(self) -> str:
    return f"Booking: {self.accession_number}"

  class Meta:
    indexes = [
      Index(fields=['accession_number']),
      Index(fields=['start_date', 'start_time'])
    ]


class WeeklyRepeat(IntegerChoices):
  EveryWeek = 0
  EvenWeek = 1
  OddWeek = 2


class ActivityDeliveryTimeSlot(TracershopModel):
  id = BigAutoField(primary_key=True)
  weekly_repeat = SmallIntegerField(choices=WeeklyRepeat.choices)
  delivery_time = TimeField()
  destination = ForeignKey(DeliveryEndpoint, on_delete=RESTRICT)
  production_run = ForeignKey(ActivityProduction, on_delete=RESTRICT)
  expiration_date = DateField(null=True, default=None)

  def __str__(self) -> str:
    return f"ActivityDeliveryTimeSlot at {Days(self.production_run.production_day).name} - {self.delivery_time} to {self.destination.owner.short_name}"

  def __repr__(self) -> str:
    return str(self)

class OrderStatus(IntegerChoices):
  Ordered = 1
  Accepted = 2
  Released = 3
  Rejected = 4

class ActivityOrder(TracershopModel):
  id = BigAutoField(primary_key=True)
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

  @property
  def tracer(self) -> Tracer:
    self.ordered_time_slot.production_run.tracer

  def canEdit(self, user: Optional[User] = None) -> AuthActions:
    if user is None:
      return AuthActions.REJECT

    database_self = self.__class__.objects.get(pk=self.pk)

    if database_self.status == OrderStatus.Released and not user.is_server_admin:
      return AuthActions.REJECT_LOG

    if self.status == OrderStatus.Released:
      if (user.is_server_admin or ReleaseRight.objects.filter(
                                    releaser=user,
                                    tracer=self.tracer).exists()):
        return AuthActions.ACCEPT_LOG
      else:
        return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT

  def canDelete(self, user: Optional[User]= None) -> AuthActions:
    self.refresh_from_db()
    if user is None:
      return AuthActions.REJECT

    if self.status == OrderStatus.Released and not user.is_server_admin:
      return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT_LOG

  def save(self, user: Optional['authModels.User'] = None, *args, **kwargs):
    if(self.id is not None and self.id < 1):
      self.id = None
    if self.id is None and user is not None:
      pass
      #self.status = OrderStatus.Ordered
      #self.ordered_by = user
    super().save(user, *args, **kwargs)

  class Meta:
    indexes = [
      Index(fields=['delivery_date'])
    ]

class TracerUsage(IntegerChoices):
  human = 0
  animal = 1
  other = 2

class InjectionOrder(TracershopModel):
  id = BigAutoField(primary_key=True)
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

  def canEdit(self, user: Optional[User] = None) -> AuthActions:
    if user is None:
      return AuthActions.REJECT

    database_self = self.__class__.objects.get(pk=self.pk)

    if database_self.status == OrderStatus.Released and not user.is_server_admin:
      return AuthActions.REJECT_LOG

    if self.status == OrderStatus.Released:
      if (user.is_server_admin or ReleaseRight.objects.filter(
                                    releaser=user,
                                    tracer=self.tracer).exists()):
        return AuthActions.ACCEPT_LOG
      else:
        return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT

  def save(self, user: Optional['authModels.User'] = None, *args, **kwargs):
    if(self.id is not None and self.id < 1):
      self.id = None
    super().save(user, *args, **kwargs)

class Vial(TracershopModel):
  id = BigAutoField(primary_key=True)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT, null=True)
  activity = FloatField()
  volume = FloatField()
  lot_number = CharField(max_length=32)
  fill_time = TimeField()
  fill_date = DateField()
  assigned_to = ForeignKey(ActivityOrder, on_delete=RESTRICT, null=True, default=None)
  owner = ForeignKey(Customer, on_delete=RESTRICT, null=True, default=None)

  def __str__(self) -> str:
    customerString = "(Missing)"
    if self.owner is not None:
      customerString = str(self.owner)

    tracerString = "(Missing)"
    if self.tracer:
      tracerString = str(self.tracer)

    return f"Vial - {tracerString} - {customerString}"

  def canDelete(self, user: Optional[User] = None) -> AuthActions:
    if user is not None and user.is_production_member:
      return AuthActions.ACCEPT_LOG

    return AuthActions.REJECT

  def canEdit(self, user: Optional[User] = None) -> AuthActions:
    if user is not None and user.is_production_member:
      return AuthActions.ACCEPT_LOG

    return AuthActions.REJECT

  class Meta:
    indexes = [
      Index(fields=['fill_date'])
    ]

class LegacyProductionMember(TracershopModel):
  id = IntegerField(primary_key=True)
  legacy_production_username = CharField(max_length=50)

class LegacyInjectionOrder(TracershopModel):
  id = IntegerField(primary_key=True)
  new_order_id = ForeignKey(InjectionOrder, on_delete=RESTRICT)
  legacy_freed_id = ForeignKey(LegacyProductionMember, on_delete=RESTRICT)

class LegacyActivityOrder(TracershopModel):
  id = IntegerField(primary_key=True)
  new_order_id = ForeignKey(ActivityOrder, on_delete=RESTRICT)
  legacy_freed_id = ForeignKey(LegacyProductionMember, on_delete=RESTRICT)
  legacy_freed_amount = FloatField(null=True, default=None)
  legacy_lot_number = CharField(max_length=32)

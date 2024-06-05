"""This module contains information about the clinical models of tracershop
It belongs here if it's related to the clinical practice.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from typing import Optional

# Third Party Packages
from django.db.models import Model, DateField, BigAutoField, CharField, EmailField, TextField, IntegerField, FloatField, ForeignKey, SmallIntegerField, RESTRICT , CASCADE, IntegerChoices, BooleanField, TimeField, DateTimeField, SET_NULL, BooleanField

# Tracershop Packages
from database.TracerShopModels.authModels import User, UserGroups
from database.TracerShopModels.baseModels import TracershopModel, Days
from database.TracerShopModels import authModels
from tracerauth.types import AuthActions

class Isotope(TracershopModel):
  id = BigAutoField(primary_key=True)
  atomic_number = SmallIntegerField()
  atomic_mass = SmallIntegerField()
  halflife_seconds = FloatField()
  atomic_letter = CharField(max_length=3)
  metastable = BooleanField(default=False)

  def __str__(self):
    baseString = f"{self.atomic_letter}-{self.atomic_mass}"
    if self.metastable:
      baseString += 'm'
    return baseString

class TracerTypes(IntegerChoices):
  ActivityBased = 1
  InjectionBased = 2

class Tracer(TracershopModel):
  id = BigAutoField(primary_key=True)
  shortname = CharField(max_length=32)
  clinical_name = CharField(max_length=256)
  isotope = ForeignKey(Isotope, on_delete=RESTRICT)
  tracer_type = SmallIntegerField(choices=TracerTypes.choices)
  default_price_per_unit = FloatField(null=True, default=None)
  vial_tag = CharField(max_length=32)
  archived = BooleanField(default=False)

  def __str__(self):
    return f"{self.shortname} - {self.isotope}"


class ActivityProduction(TracershopModel):
  id = BigAutoField(primary_key=True)
  production_day = SmallIntegerField(choices=Days.choices)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  production_time = TimeField()
  expiration_date = DateField(null=True, default=None)

  def __str__(self) -> str:
    return f"Production of {self.tracer.shortname} - {Days(self.production_day).name} - {self.production_time}"

class ReleaseRight(TracershopModel):
  id = BigAutoField(primary_key=True)
  expiry_date = DateField(null=True, default=None)
  releaser = ForeignKey(User, on_delete=RESTRICT)
  product = ForeignKey(Tracer, on_delete=RESTRICT)

  def canCreate(self, user: Optional[User]= None) -> AuthActions:
    if user is None:
      return AuthActions.REJECT

    if not user.is_production_admin:
      return AuthActions.REJECT_LOG

    if user.user_group == UserGroups.ProductionAdmin \
        and self.releaser.pk == user.pk:
      return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT_LOG

  def canEdit(self, user: Optional[User] = None) -> AuthActions:
    if user is None:
      return AuthActions.REJECT

    if not user.is_production_admin:
      return AuthActions.REJECT_LOG

    if user.user_group == UserGroups.ProductionAdmin and self.releaser.pk == user.pk:
      return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT_LOG

  def canDelete(self, user: Optional[User] = None) -> AuthActions:
    if user is None:
      return AuthActions.REJECT

    if not user.is_production_admin:
      return AuthActions.REJECT_LOG

    return AuthActions.ACCEPT_LOG

  def __str__(self) -> str:
    baseString = f"ReleaseRight for {self.releaser} - {self.product}"
    if self.expiry_date is not None:
      baseString += f" expiring: {self.expiry_date}"
    return baseString
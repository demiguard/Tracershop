"""This module contains information about the clinical models of tracershop
It belongs here if it's related to the clinical practice.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library

# Third Party Packages
from django.db.models import Model, DateField, BigAutoField, CharField, EmailField, TextField, IntegerField, FloatField, ForeignKey, SmallIntegerField, RESTRICT , CASCADE, IntegerChoices, BooleanField, TimeField, DateTimeField, SET_NULL, BooleanField

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel, Days


class Isotope(TracershopModel):
  isotope_id = BigAutoField(primary_key=True)
  atomic_number = SmallIntegerField()
  atomic_mass = SmallIntegerField()
  halflife_seconds = FloatField()
  atomic_letter = CharField(max_length=3)
  metastable = BooleanField(default=False)

class TracerTypes(IntegerChoices):
  ActivityBased = 1
  InjectionBased = 2

class Tracer(TracershopModel):
  tracer_id = BigAutoField(primary_key=True)
  shortname = CharField(max_length=32)
  clinical_name = CharField(max_length=256)
  isotope = ForeignKey(Isotope, on_delete=RESTRICT)
  tracer_type = SmallIntegerField(choices=TracerTypes.choices)
  default_price_per_unit = FloatField(null=True, default=None)
  vial_tag = CharField(max_length=32)
  archived = BooleanField(default=False)

class ActivityProduction(TracershopModel):
  activity_production_id = BigAutoField(primary_key=True)
  production_day = SmallIntegerField(choices=Days.choices)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  production_time = TimeField()
  expiration_date = DateField(null=True, default=None)

  def __str__(self) -> str:
    return f"Production of {self.tracer.shortname} - {Days(self.production_day).name} - {self.production_time}"

  def __repr__(self) -> str:
    return str(self)
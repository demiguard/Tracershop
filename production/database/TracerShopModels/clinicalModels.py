"""This module contains information about the clinical models of tracershop
It belongs here if it's related to the clinical practice.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library

# Third Party Packages
from django.db.models import Model, DateField, BigAutoField, CharField, EmailField, TextField, IntegerField, FloatField, ForeignKey, SmallIntegerField, RESTRICT , CASCADE, IntegerChoices, BooleanField, TimeField, DateTimeField, SET_NULL

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel, Days


class Isotope(TracershopModel):
  isotope_id = BigAutoField(primary_key=True)
  atomic_number = SmallIntegerField()
  atomic_mass = SmallIntegerField()
  halflife_seconds = FloatField()
  atomic_letter = CharField(max_length=3)

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


class Procedure(Model):
  procedure_id = BigAutoField(primary_key=True)
  series_description = CharField(max_length=128)
  tracer_units = FloatField()
  in_use = BooleanField(default=False)
  delay_minutes = FloatField()
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)

class ActivityProduction(Model):
  activity_production_id = BigAutoField(primary_key=True)
  production_day = SmallIntegerField(choices=Days.choices)
  tracer = ForeignKey(Tracer, on_delete=RESTRICT)
  production_time = TimeField()

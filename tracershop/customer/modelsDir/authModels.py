from django.db import models
from django.db.models import Model, AutoField, BooleanField, CharField, DateField, ForeignKey, IntegerField, TimeField
from django.db.models import CASCADE, SET_NULL

from customer.modelsDir.clinicalModels import Procedure

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class PotentialUser(AbstractBaseUser):
  id       = AutoField(primary_key=True)
  username = CharField(max_length=120, unique=True)
  password = CharField(max_length=256)

  first_name = CharField(max_length=30, blank=True, null=True)
  last_name  = CharField(max_length=60, blank=True, null=True)
  #User Identification
  email_1 = CharField(max_length=256, blank=True, null=True)
  email_2 = CharField(max_length=256, blank=True, null=True)
  email_3 = CharField(max_length=256, blank=True, null=True)
  email_4 = CharField(max_length=256, blank=True, null=True)

  address  = CharField(max_length=60,  blank=True, null=True)
  location = CharField(max_length=60,  blank=True, null=True)
  cityname = CharField(max_length=60,  blank=True, null=True)
  postcode = CharField(max_length=30,  blank=True, null=True)
  # 

  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password']

  def __str__(self):
    return self.username


class Booking(Model):
  procedure       = ForeignKey(Procedure, on_delete=CASCADE)
  location        = ForeignKey(location)
  accessionNumber = CharField(max_length=16, primary_key=True)
  startDate       = DateField()
  startTime       = TimeField()


class Location(Model):
  location = CharField(max_length=16, primary_key=True)

  def __str__(self):
    return self.location


class Kunde(Model):
  ID        = AutoField(primary_key=True)
  kundeName = CharField(max_length=30)
  is_REGH   = BooleanField(default=False)

  def __str__(self):
    return self.kundeName

class KundeUsesLocation(Model):
  location = ForeignKey(Location, primary_key=True, on_delete=CASCADE)
  kunde    = ForeignKey(Kunde, primary_key=True, on_delete=CASCADE)


from django.db import models
from django.db.models import Model, AutoField, BooleanField, CharField, ForeignKey

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

from customer.modelsDir.authModels import PotentialUser, Booking, Kunde, KundeUsesLocation, Location
from customer.modelsDir.networkingModels import Address, Database, AET
from customer.modelsDir.clinicalModels import Tracer, Procedure

#
class User(AbstractBaseUser):
  id = AutoField(primary_key=True)
  username = CharField(max_length=120, unique=True)
  password = CharField(max_length=256)
  is_staff = BooleanField(default=False)
  is_admin = BooleanField(default=False)

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
  customer_number = ForeignKey(Kunde, on_delete=models.SET_NULL, null=True)

  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password']

  def __str__(self):
    return self.username



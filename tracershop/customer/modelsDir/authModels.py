from django.db import models
from django.db.models import AutoField, BooleanField, CharField, DateField, DateTimeField, ForeignKey, IntegerField, TimeField
from django.db.models import CASCADE, SET_NULL
from customer.modelsDir.BaseModels import SubscribeableModel
from customer.modelsDir.clinicalModels import Procedure

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class PotentialUser(AbstractBaseUser, SubscribeableModel):
  ID       = AutoField(primary_key=True)
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





class UpdateTimeStamp(SubscribeableModel):
  ID = IntegerField(primary_key=True)
  timeStamp = DateTimeField()
  

class Customer(SubscribeableModel):
  ID                    = AutoField(primary_key=True)
  customerName          = CharField(max_length=30)
  is_REGH               = BooleanField(default=False)
  defualtActiveCustomer = BooleanField(default=False) #This means the customer would be assigned to new Users
  AET                   = CharField(max_length=16, null=True, default=None)
  TestCustomer          = BooleanField(default=False) #This means it will not show up in 

  def __str__(self):
    return self.customerName

class Location(SubscribeableModel):
  location   = CharField(max_length=16, primary_key=True)
  LocName    = CharField(max_length=32, default="")
  AssignedTo = ForeignKey(Customer, on_delete=SET_NULL, null=True, default=None) 

  def __str__(self):
    if self.LocName:
      return self.LocName
    else:
      return self.location


class Booking(SubscribeableModel):
  procedure       = ForeignKey(Procedure, on_delete=CASCADE)
  location        = ForeignKey(Location, on_delete=SET_NULL, null=True)
  accessionNumber = CharField(max_length=16, primary_key=True)
  startDate       = DateField()
  startTime       = TimeField()
  status          = IntegerField(default=0)
  orderNumber     = IntegerField(default=None, null=True)

  def __str__(self):
    return str(self.accessionNumber)

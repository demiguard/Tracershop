from django.db import models
from django.db.models import Model

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# Create your models here.

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=256)
  is_staff = models.BooleanField(default=False)
  is_admin = models.BooleanField(default=False)

  first_name = models.CharField(max_length=30, blank=True, null=True)
  last_name  = models.CharField(max_length=60, blank=True, null=True)
  #User Identification
  email_1 = models.CharField(max_length=256, blank=True, null=True)
  email_2 = models.CharField(max_length=256, blank=True, null=True)
  email_3 = models.CharField(max_length=256, blank=True, null=True)
  email_4 = models.CharField(max_length=256, blank=True, null=True)

  address  = models.CharField(max_length=60,  blank=True, null=True)
  location = models.CharField(max_length=60,  blank=True, null=True)
  cityname = models.CharField(max_length=60,  blank=True, null=True)
  postcode = models.CharField(max_length=30,  blank=True, null=True)
  # 
  customer_number = models.IntegerField(default=0)

  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password']

  def __str__(self):
    return self.username


class PotentialUser(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=256)

  first_name = models.CharField(max_length=30, blank=True, null=True)
  last_name  = models.CharField(max_length=60, blank=True, null=True)
  #User Identification
  email_1 = models.CharField(max_length=256, blank=True, null=True)
  email_2 = models.CharField(max_length=256, blank=True, null=True)
  email_3 = models.CharField(max_length=256, blank=True, null=True)
  email_4 = models.CharField(max_length=256, blank=True, null=True)

  address  = models.CharField(max_length=60,  blank=True, null=True)
  location = models.CharField(max_length=60,  blank=True, null=True)
  cityname = models.CharField(max_length=60,  blank=True, null=True)
  postcode = models.CharField(max_length=30,  blank=True, null=True)
  # 

  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password']

  def __str__(self):
    return self.username


class ServerConfiguration(Model):
  pass


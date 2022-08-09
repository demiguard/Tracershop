from gettext import NullTranslations
from database.TracerShopModels.BaseModels import SubscribeableModel

from django.db import models
from django.db.models import Model
from django.contrib.auth.models import AbstractBaseUser


class UserGroup(Model):
  """This model resprents the differnt option for user groups. They are
    1. Admin
    2. Production
    3. Ordering
    4. Ordering (No RIS)
  """
  id = models.BigAutoField(primary_key=True)
  description = models.CharField(max_length=64)

  def __str__(self) -> str:
    return self.description

class Customer(Model):
  """This is the model represents a model
  """
  id = models.BigAutoField(primary_key=True)
  shortname = models.CharField(max_length=60)
  longname = models.CharField(max_length=120, null=True, default=None)
  overhead = models.PositiveIntegerField(0)
  telefon = models.CharField(max_length=24)

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=120)
  UserGroup = models.ForeignKey(UserGroup, on_delete=models.RESTRICT, null=True)

  Customer = models.ManyToManyField(Customer)
  # This number overlaps with Users.id field of the old database.
  # Note for user in this database and not in the other database,
  # this field is an auto incremented with an offset of 10000.
  # However it should be ensured with appilcation level code, Sorry.
  OldTracerBaseID = models.IntegerField(unique=True)



  USERNAME_FIELD = 'username'

  def __str__(self):
    return self.username



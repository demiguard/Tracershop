from database.TracerShopModels.baseModels import SubscribableModel

from django.db import models
from django.db.models import Model
from django.contrib.auth.models import AbstractBaseUser


class UserGroups(models.IntegerChoices):
  Anon = 0
  Admin = 1
  ProductionAdmin = 2
  ProductionUser = 3
  ShopAdmin = 4
  ShopUser = 5
  ShopExternal = 6

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=120)
  UserGroup = models.IntegerField(choices=UserGroups.choices)

  # This number overlaps with Users.id field of the old database.
  # Note for user in this database and not in the other database,
  # this field is an auto incremented with an offset of 10000.
  # However it should be ensured with appilcation level code, Sorry.
  OldTracerBaseID = models.IntegerField(unique=True, null=True, default=None)

  USERNAME_FIELD = 'username'

  def __str__(self):
    return self.username



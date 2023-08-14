"""This module contains django models related to the authentication and user of
Tracershop.

"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Packages
from typing import List

# Third party Packages
from django.db import models
from django.db.models import Model, BigAutoField, CASCADE, CharField, EmailField, ForeignKey, IntegerChoices, SmallIntegerField, RESTRICT, BooleanField

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel
from lib.utils import classproperty

from django.contrib.auth.models import AbstractBaseUser


class UserGroups(IntegerChoices):
  Anon = 0
  Admin = 1
  ProductionAdmin = 2
  ProductionUser = 3
  ShopAdmin = 4
  ShopUser = 5
  ShopExternal = 6

class User(AbstractBaseUser, TracershopModel):
  id = BigAutoField(primary_key=True)
  username = CharField(max_length=120, unique=True)
  password = CharField(max_length=120)
  UserGroup = SmallIntegerField(choices=UserGroups.choices, default= UserGroups.Anon)
  active = BooleanField(default=True)
  # This number overlaps with Users.id field of the old database.
  # Note for user in this database and not in the other database,
  # this field is an auto incremented with an offset of 10000.
  # However it should be ensured with appilcation level code, Sorry.
  OldTracerBaseID = SmallIntegerField(unique=True, null=True, default=None)

  USERNAME_FIELD = 'username'

  @classproperty
  def exclude(cls) -> List[str]:
    return ['password']

  def __str__(self):
    return self.username


class SecondaryEmail(TracershopModel):
  secondary_email_id = BigAutoField(primary_key=True)
  email = EmailField()
  record_user = ForeignKey(User, on_delete=CASCADE)

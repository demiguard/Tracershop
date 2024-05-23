"""This module contains django models related to the authentication and user of
Tracershop.

"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Packages
from typing import List

# Third party Packages
from django.db.models import Model, BigAutoField, CASCADE, CharField,\
  EmailField, ForeignKey, IntegerChoices, SmallIntegerField, RESTRICT,\
    BooleanField, DateTimeField, Index

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
  user_group = SmallIntegerField(choices=UserGroups.choices, default= UserGroups.Anon)
  active = BooleanField(default=True)


  USERNAME_FIELD = 'username'

  @property
  def is_server_admin(self) -> bool:
    return self.user_group == UserGroups.Admin

  @property
  def is_production_admin(self) -> bool:
    return self.user_group in [UserGroups.Admin, UserGroups.ProductionAdmin]

  @property
  def is_production_member(self) -> bool:
    return self.user_group in [UserGroups.Admin,
                               UserGroups.ProductionAdmin,
                               UserGroups.ProductionUser]

  @property
  def is_shop_admin(self) -> bool:
    return self.user_group in [UserGroups.Admin, UserGroups.ShopAdmin]

  @property
  def is_shop_member(self) -> bool:
    return self.user_group in [UserGroups.Admin,
                               UserGroups.ShopAdmin,
                               UserGroups.ShopUser,
                               UserGroups.ShopExternal]

  @classproperty
  def exclude(cls) -> List[str]:
    return ['password']

  def __str__(self):
    return self.username


class SecondaryEmail(TracershopModel):
  id = BigAutoField(primary_key=True)
  email = EmailField()
  record_user = ForeignKey(User, on_delete=CASCADE)

class SuccessfulLogin(TracershopModel):
  id = BigAutoField()
  login_time = DateTimeField(auto_now=True)
  user = ForeignKey(User, CASCADE)

  class Meta:
    indexes = [
      Index(fields="login_time")
    ]

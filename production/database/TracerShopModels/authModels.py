"""This module contains django models related to the authentication and user of
Tracershop.

"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Packages
from typing import Any, List, Optional

# Third party Packages
from django.db.models import Model, BigAutoField, CASCADE, CharField,\
  EmailField, ForeignKey, IntegerChoices, SmallIntegerField, RESTRICT,\
    BooleanField, DateTimeField, Index

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel

from lib.utils import classproperty
from django.contrib.auth.models import AbstractBaseUser

from tracerauth.types import AuthActions


class UserGroups(IntegerChoices):
  Anon = 0
  Admin = 1
  ProductionAdmin = 2
  ProductionUser = 3
  ShopAdmin = 4
  ShopUser = 5
  ShopExternal = 6

  def __str__(self):
    match self:
      case UserGroups.Anon:
        return "Anonymous"
      case UserGroups.Admin:
        return "Admin"
      case UserGroups.ProductionAdmin:
        return "Production admin"
      case UserGroups.ProductionUser:
        return "Production User"
      case UserGroups.ShopAdmin:
        return "Shop Admin"
      case UserGroups.ShopUser:
        return "Internal shop user"
      case UserGroups.ShopExternal:
        return "External Shop User"
    raise ValueError("Undefined User Group")


class UserGroupField(SmallIntegerField):
  def from_db_value(self, value, expression, connection):
    if value is None:
      return UserGroups.Anon
    return UserGroups(value)

class User(AbstractBaseUser, TracershopModel):
  username = CharField(max_length=120, unique=True, help_text="This field contains the regional ID", verbose_name="Regional ID")
  password = CharField(max_length=120)
  user_group = UserGroupField(choices=UserGroups.choices, default= UserGroups.Anon)
  active = BooleanField(default=True)
  bam_id = CharField(
    max_length=120,
    help_text="This field contains the bam ID, if empty the bam_id and username are equal",
    verbose_name="Local ID",
    default=""
  )

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

  def upgrade_user_group(self, new_user_group):
    if new_user_group == UserGroups.Anon:
      return

    self.user_group = new_user_group
    self.save()

  @classproperty
  def exclude(cls):
    return ['password']

  def __str__(self):
    return f"{self.username} : {self.user_group}" if not self.bam_id else f"{self.bam_id} - {self.username} : {self.user_group}"


class SecondaryEmail(TracershopModel):
  email = EmailField()
  record_user = ForeignKey(User, on_delete=CASCADE)

class SuccessfulLogin(TracershopModel):
  login_time = DateTimeField(auto_now=True)
  user = ForeignKey(User, CASCADE)

  def __str__(self) -> str:
    return f"{self.user.username} - {self.login_time}"

  class Meta: #type: ignore
    indexes = [
      Index(fields=["login_time"])
    ]

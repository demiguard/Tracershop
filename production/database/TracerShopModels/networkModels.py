"""
"""

__author__ = "Christoffer Vilstrup Jensen"

# Standard Python Packages

# Third Party Packages
from django.db.models import BigAutoField, BooleanField, CharField, ForeignKey, SET_NULL, RESTRICT, IntegerField, IntegerChoices, SmallIntegerField

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel


class Address(TracershopModel):
  ID = BigAutoField(primary_key=True)
  ip   = CharField(max_length=30, null=True)
  port = CharField(max_length=6, null=True)
  description = CharField(max_length=120,null=True)

  def __str__(self):
    if self.description:
      return self.description
    else:
      return "This Address does not have a description please fix"

class DatabaseType(IntegerChoices):
  UnknownDatabase = 0
  DjangoDatabase = 1
  TracershopProductionDatabaseLegacy = 2
  TracershopProductionDatabase = 3

class Database(TracershopModel):
  databaseName = CharField(max_length=32, primary_key=True)
  username = CharField(max_length=32)
  password = CharField(max_length=32, null=True)
  legacy_database = BooleanField(default=False)
  address  = ForeignKey(
    Address,
    on_delete=SET_NULL,
    null=True
  )
  testinDatabase = BooleanField(default=False) #testing databases do not send mails
  databaseType = SmallIntegerField(choices=DatabaseType.choices, default=DatabaseType.UnknownDatabase)

  def __str__(self):
    return self.databaseName

class DicomEndpoint(TracershopModel):
  dicom_endpoint_id = BigAutoField(primary_key=True)
  address = ForeignKey(Address, on_delete=RESTRICT)
  ae_title = CharField(max_length=16)

  def __str__(self):
    return f"{self.ae_title} - {self.address.ip}:{self.address.port}"

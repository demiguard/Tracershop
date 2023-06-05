""""""

# Python standard library
from abc import ABC
from dataclasses import dataclass
from datetime import date
from typing import Dict
import re
from typing import Optional
# Third party library

# Tracershop production packages
from database.models import DatabaseType
from dataclass.json_dataclass import TypeSafeJsonDataclass


@dataclass(init=False)
class DatabaseDataclass(TypeSafeJsonDataclass):
  """This

  Args:
      TypeSafeJsonDataclass (_type_): _description_
  """
  @classmethod
  def getSQLTable(cls, databaseType: Optional[DatabaseType]) -> str:
    if databaseType == DatabaseType.TracershopProductionDatabaseLegacy:
      LegacyTable = cls._SQLLegacyTable()
      if LegacyTable != "":
        return LegacyTable
      else:
        raise Exception

    words = re.findall('[A-Z][^A-Z]*', cls.__name__) # DatabaseDataclass -> ['Database', Dataclass]
    return '_'.join(words)

  @classmethod
  def _SQLLegacyTable(cls):
    return ""


@dataclass(init=False)
class ClosedDate(DatabaseDataclass):
  close_date_id : int
  close_date: date


@dataclass(init=False)
class Address(DatabaseDataclass):
  address_id : int
  ip : str
  port : str
  description : str


@dataclass(init=False)
class RecordUser(DatabaseDataclass):
  record_user_id : int
  primary_email : str
  telephone : str


@dataclass(init=False)
class SecondaryEmail(DatabaseDataclass):
  secondary_email_id : int
  email: str
  record_user: RecordUser


@dataclass(init=False)
class Customer(DatabaseDataclass):
  customer_id: int
  short_name: str
  long_name: str
  dispenser_id: int
  billing_address: str
  billing_city: str
  billing_email: str
  billing_phone: str
  billing_zip_code: int
  active_directory_code: str

@dataclass(init=False)
class UserAssignment(DatabaseDataclass):
  user_id: RecordUser
  customer_id: Customer


@dataclass(init=False)
class Message(DatabaseDataclass):
  message_id: int
  message: str
  expiration: date


@dataclass(init=False)
class MessageAssignment(DatabaseDataclass):
  message_id: Message
  customer_id: Customer

@dataclass(init=False)
class TracerEndpoint(DatabaseDataclass):
  tracer_endpoint_id: int
  address: str
  city: str
  zip_code: int
  phone: int
  name: str
  owner: Customer

@dataclass(init=False)
class Location(DatabaseDataclass):
  location_id: int
  endpoint: TracerEndpoint
  common_name: str




DATACLASSES = []
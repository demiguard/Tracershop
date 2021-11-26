"""
  Production dataclasses

  This module contains all the dataclasses that is passed around in the server
  The main purpose is to make in 100% clear what data is transfered around
  instead of have dict with specific key word dependencies.
  Dataclasses makes the depencies clear and hopefully increase readablitity +
  Modifibility

"""
__author__= "Christoffer Vilstrup Jensen"

import dataclasses
import json

import dataclasses
from dataclasses import dataclass, asdict
from typing import Dict, Optional, List
from datetime import datetime, date, time

@dataclass
class JsonSerilizableDataClass:
  """
    This is a Wrapper class for the other dataclasses
    It allows for conversion between json objects (dict) and dataclasses
  """
  def toDict(self) -> Dict:
    """
      Returns the dict corrosponding to the dataclass
    """
    return asdict(self)

  def toJSON(self) -> Dict:
    """
      Wrapper function for toDict
    """
    return self.toDict()

  def to_dict(self) -> Dict:
    """
      This is a wrapper function for the json encoder
    """
    return self.toDict()

  @classmethod
  def fromDict(cls, ClassDict : Dict):
    """
      This method allows for construction of the dataclass using a dict.
    """
    return cls(**ClassDict)

  @classmethod
  def getFields(cls) -> List[str]:
    return [field.name for field in dataclasses.fields(cls)]

# Below are the actual dataclass that's passed around in Server

@dataclass
class ActivityOrderDataClass(JsonSerilizableDataClass):
  deliver_datetime : datetime
  oid : int
  status : int
  amount : float
  amount_o : float
  total_amount : float
  total_amount_o : float
  run : int
  BID : int
  batchnr : str
  COID : int


@dataclass
class InjectionOrderDataClass(JsonSerilizableDataClass):
  deliver_datetime : datetime
  oid : int
  status : int
  injections : int
  usage : int
  comment : str
  username : str
  tracer : int


@dataclass
class VialDataClass(JsonSerilizableDataClass):
  customer : int
  charge : str
  filldate : date
  filltime : time
  volume : float
  ID : int
  activity : float
  OrderMap : Optional[int]


@dataclass
class TracerCustomerMappingDataClass(JsonSerilizableDataClass):
  tracer_id : int
  customer_id : int


@dataclass
class DeliverTimeDataClass(JsonSerilizableDataClass):
  BID : int
  day : int
  repeat : int
  dtime : time
  run : int


@dataclass
class CustomerDeliverTimeDataClass(JsonSerilizableDataClass):
  day : int
  repeat : int
  dtime : time
  max : int
  run : int
  DTID : int # DeliverTimeID

@dataclass
class RunsDataClass(JsonSerilizableDataClass):
  day : int
  ptime : time
  run : int


@dataclass
class IsotopeDataClass(JsonSerilizableDataClass):
  ID : int
  name : str
  halflife : float


@dataclass
class TracerDataClass(JsonSerilizableDataClass):
  id : int
  name : str
  isotope : int 
  n_injections : int 
  order_block : int
  in_use : bool
  tracer_type : int


@dataclass
class CustomerDataClass(JsonSerilizableDataClass):
  UserName : str
  ID : int
  overhead : int
  CustomerNumber : int
  Name : str


@dataclass
class UserDataClass(JsonSerilizableDataClass):
  email1 : str
  email2 : str
  email3 : str
  email4 : str
  overhead : int
  kundenr : int
  contact : str
  tlf : str
  Username : str
  Realname : str
  addr1 : str
  addr2 : str
  addr3 : str
  addr4 : str
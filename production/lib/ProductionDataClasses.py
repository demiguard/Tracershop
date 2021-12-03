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
from dataclasses import dataclass, asdict, fields
from typing import Dict, Optional, List
from datetime import datetime, date, time
from constants import DATETIME_FORMAT, DATE_FORMAT, TIME_FORMAT
from Formatting import toTime, toDateTime, toDate

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

  def __init__(self, *args):
    for field, fieldVal in zip(fields(self), args):
      fieldValType = type(fieldVal)
      if fieldValType == field.type:
        self.__setattr__(field.name, fieldVal)
      elif field.type == date:
        self.__setattr__(field.name, date.strptime(fieldVal, DATE_FORMAT))
      elif field.type == datetime:
        self.__setattr__(field.name, datetime.strptime(fieldVal, DATETIME_FORMAT))
      elif field.type == time:
        
        
        self.__setattr__(field.name, time.strptime(fieldVal, TIME_FORMAT))
      else:
        try:
          self.__setattr__(field.name, field.type(fieldVal))
        except ValueError:
          raise TypeError(f"""The Field: {field.name} was Assigned a object of type: {type(fieldVal)}
            The dataclass cannot nativily convert this to {field.type}""")

  ##### This is good to have since the init mehtod might be over written
  def __post_init__(self):
    for field in fields(self):
      if type(self.__getattribute__(field.name)) != field.type:
        raise TypeError(f"""The Field: {field.name} was Assigned a object of type: {type(self.__getattribute__(field.name))}
          The dataclass cannot nativily convert this to {field.type}""")


# Below are the actual dataclass that's passed around in Server

@dataclass(init=False)
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


@dataclass(init=False)
class InjectionOrderDataClass(JsonSerilizableDataClass):
  deliver_datetime : datetime
  oid : int
  status : int
  injections : int
  usage : int
  comment : str
  username : str
  tracer : int


@dataclass(init=False)
class VialDataClass(JsonSerilizableDataClass):
  customer : int
  charge : str
  filldate : date
  filltime : time
  volume : float
  activity : float
  ID : Optional[int]
  OrderMap : Optional[int]


@dataclass(init=False)
class TracerCustomerMappingDataClass(JsonSerilizableDataClass):
  tracer_id : int
  customer_id : int


@dataclass(init=False)
class DeliverTimeDataClass(JsonSerilizableDataClass):
  BID : int
  day : int
  repeat : int
  dtime : time
  run : int


@dataclass(init=False)
class CustomerDeliverTimeDataClass(JsonSerilizableDataClass):
  day : int
  repeat : int
  dtime : time
  max : int
  run : int
  DTID : int # DeliverTimeID

@dataclass(init=False)
class RunsDataClass(JsonSerilizableDataClass):
  day : int
  ptime : time
  run : int


@dataclass(init=False)
class IsotopeDataClass(JsonSerilizableDataClass):
  ID : int
  name : str
  halflife : float


@dataclass(init=False)
class TracerDataClass(JsonSerilizableDataClass):
  id : int
  name : str
  isotope : int 
  n_injections : int 
  order_block : int
  in_use : bool
  tracer_type : int


@dataclass(init=False)
class CustomerDataClass(JsonSerilizableDataClass):
  UserName : str
  ID : int
  overhead : int
  CustomerNumber : int
  Name : str


@dataclass(init=False)
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
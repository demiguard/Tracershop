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

from dataclasses import dataclass, asdict, fields, Field
from typing import Dict, Optional, List, Any, get_args, get_origin, Union
from datetime import datetime, date, time

from constants import DATETIME_FORMAT, DATE_FORMAT, TIME_FORMAT, JSON_DATETIME_FORMAT

from lib.Formatting import toTime, toDateTime, toDate
from TracerAuth.models import User

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
  def getFields(cls) -> List[Field]:
    """[summary]

    Returns:
        List[Field]: [description]
    """
    return fields(cls)

  @classmethod
  def getSQLFields(cls):
    Fields = cls.getFields()
    return ", ".join([field.name for field in Fields])

  def getSQLTable(cls):
    """If relevant This function should be overwritten with the relevant SQL

    Raises:
        NotImplemented: This function must be implemented by a superclass
            if it isn't and this function is called, NotImplemented is raised
    """
    raise NotImplemented


  def __TypeSafeSetAttr(self, field : Field, fieldVal : Any) -> None:
    """This function attempts to set a field after performing type checking.
    If Typechecking fails, it will attempt to perform some conversion between 
    input type and the designated type
    
    Args:
      self (JsonSerilizableDataclass): The object where an attribute is set
      field (dataclass.Field): The field that is being set
      fieldval (Any): The value that will be set, it's not on type field.type 
                      then it will be converted or raise a TypeError

    Raises:
      TypeError: When type conversion of a field fails.
    """

    fieldValType = type(fieldVal)
    if fieldValType == field.type:
      self.__setattr__(field.name, fieldVal)
    elif get_origin(field.type) == Union:
      if fieldValType in get_args(field.type):
        self.__setattr__(field.name, fieldVal)
    elif field.type == date:
      self.__setattr__(field.name, toDate(fieldVal))
    elif field.type == datetime:
      try:
        self.__setattr__(field.name, toDateTime(fieldVal))
      except ValueError:
        self.__setattr__(field.name, toDateTime(fieldVal, Format=JSON_DATETIME_FORMAT))
    elif field.type == time:
      
      self.__setattr__(field.name, toTime(fieldVal))
    elif field.type == int:
      if fieldValType == type(None):
        self.__setattr__(field.name,0)
      else:
        try:
          self.__setattr__(field.name, field.type(fieldVal))
        except ValueError:
          raise TypeError(f"""The Field: {field.name} was Assigned a object of type: {type(fieldVal)}
            The dataclass cannot nativily convert this to {field.type}""")  
    else:
      try:
        self.__setattr__(field.name, field.type(fieldVal))
      except ValueError:
        raise TypeError(f"""The Field: {field.name} was Assigned a object of type: {type(fieldVal)}
          The dataclass cannot nativily convert this to {field.type}""")

  def __init__(self, *args, **kwargs):
    Myfields = self.getFields()
    fieldDict = { field.name : field for field in Myfields}
    
    # Initialize Optionals as None
    # Note that Optional[types] is just shorthand for Union[Types, Nonetype]
    for field in Myfields:
      if get_origin(field.type) == Union and type(None) in get_args(field.type):
        self.__setattr__(field.name, None)

    for field, fieldVal in zip(Myfields, args):
      self.__TypeSafeSetAttr(field, fieldVal)    

    for fieldName, fieldVal in kwargs.items():
      if field := fieldDict.get(fieldName):
        self.__TypeSafeSetAttr(field, fieldVal)
      else:
        raise KeyError(f"Unknown keyword in construction:{fieldName} for construction of: {type(self)}")
        
  ##### This is good to have since the init mehtod might be over written and it ensure type safity
  def __post_init__(self):
    for field in fields(self):
      attrType = type(self.__getattribute__(field.name))
      if attrType == field.type:
        continue
      if get_origin(field.type) == Union:
        if attrType in get_args(field.type):
          continue
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
  frigivet_af : int #id matching to OldDatabaseID
  frigivet_amount : float
  frigivet_datetime : Optional[datetime]

  @classmethod
  def getSQLTable(cls):
    return "orders"

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
  ID : Union[int, None]
  OrderMap : Optional[int]

  @classmethod
  def getSQLFields(cls) -> str:
    return """
      VAL.customer,
      VAL.charge,
      VAL.filldate,
      TIME_FORMAT(VAL.filltime, \"%T\"),
      VAL.volume,
      VAL.activity,
      VAL.ID,
      VialMapping.Order_id
    """

  @classmethod
  def getSQLTable(cls) -> str: 
    return "VAL LEFT JOIN VialMapping on VAL.ID=VialMapping.VAL_id"

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

  @classmethod
  def getSQLTable(cls):
    return "isotopes"


@dataclass(init=False)
class TracerDataClass(JsonSerilizableDataClass):
  id : int
  name : str
  isotope : int 
  n_injections : int 
  order_block : int
  in_use : bool
  tracer_type : int

  @classmethod
  def getSQLTable(cls):
    return "Tracers"

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

  @classmethod
  def getSQLTable(cls):
    return "Users"

@dataclass(init=False)
class EmployeeDataClass(JsonSerilizableDataClass):
  Username : str
  OldTracerBaseID : int

  @classmethod
  def fromUser(cls, user: User):
    return cls(Username=user.username, OldTracerBaseID=user.OldTracerBaseID)
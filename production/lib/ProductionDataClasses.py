"""
  Production dataclasses

  This module contains all the dataclasses that is passed around in the server
  The main purpose is to make in 100% clear what data is transfered around
  instead of have dict with specific key word dependencies.
  Dataclasses makes the depencies clear and hopefully increase readablitity +
  Modifibility

"""
__author__= "Christoffer Vilstrup Jensen"

from contextlib import AbstractAsyncContextManager
import dataclasses
import json

from abc import abstractclassmethod
from dataclasses import dataclass, asdict, fields, Field
from datetime import datetime, date, time
from pprint import pprint
import re
from types import NoneType
from typing import Dict, Optional, List, Any, get_args, get_origin, Union
from constants import DATETIME_FORMAT, DATE_FORMAT, JSON_CLOSEDDATE, JSON_TRACER_MAPPING, TIME_FORMAT, JSON_DATETIME_FORMAT, JSON_ACTIVITY_ORDER,  JSON_CUSTOMER, JSON_DELIVERTIME, JSON_ISOTOPE, JSON_RUN, JSON_TRACER, JSON_VIAL, JSON_INJECTION_ORDER
from lib.Formatting import toTime, toDateTime, toDate
from database.models import User
from lib.utils import LMAP
from lib.SQL.SQLFormatter import SerilizeToSQLValue


@dataclass
class JsonSerilizableDataClass:
  """
    This is a Wrapper class for the other dataclasses
    It allows for conversion between json objects (dict) and dataclasses
  """
  #def __getitem__(self, item):
  #  return getattr(self, item)

  #def __setattr__(self, name, value):
  #  setattr(self, name, value)

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
    f"""Alternative consturctor from a dictionary

    Args:
        ClassDict (Dict): Dict with the fields: {", ".join([field.name for field in cls.getFields()])}

    Returns:
        [type]: [description]
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
  def getSQLWhere(cls) -> str:
    """
    This function should be called in conjuction with a coditional statement in an SQL
    By Default this is just TRUE, hence no filtering, however the function that
    need filtering are expected to implement their own version of this function

    Returns:
        str: SubQuery with valid SQL condition statement
    """
    return "TRUE"

  @classmethod
  @abstractclassmethod
  def getSQLDateTime() -> str:
    """ This is abstract method, that is called when the SQL modules needs to constrtuct a query with an condition based on a date or datetime field

    Raises:
        NotImplemented: If the super class doesn't have field upon which you can create a datetime, then this raises an not implemented.
    """
    raise NotImplemented # pragma: no cover

  @classmethod
  @abstractclassmethod
  def getIDField(cls) -> str:
    """Abstract method for generating ID

    Raises:
        NotImplemented: _description_
    """
    raise NotImplemented # pragma: no cover

  @classmethod
  def createDataClassQuery(cls, skeleton) -> str:
    Fields = []
    Values = []

    for (k, v) in skeleton.items():
      Fields.append(k)
      Values.append(SerilizeToSQLValue(v, NoneTypeRes="NULL"))

    for ExtraField, ExtraValue in zip(cls.getExtraFields(), cls.getExtraValues()):
      if ExtraField not in Fields:
        Fields.append(ExtraField)
        Values.append(ExtraValue)

    return f"""INSERT INTO {cls.getSQLTable()}({
      ", ".join(map(str, Fields))}) VALUES ({", ".join(map(str,Values))})"""

  @classmethod
  def getSQLFields(cls):
    Fields = cls.getFields()
    return ", ".join([field.name for field in Fields])

  @abstractclassmethod
  def getSQLTable(cls):
    """If relevant This function should be overwritten with the relevant SQL

    Raises:
        NotImplemented: This function must be implemented by a superclass
            if it isn't and this function is called, NotImplemented is raised
    """
    raise NotImplemented

  @classmethod
  def getExtraFields(cls) -> List:
    return []

  @classmethod
  def getExtraValues(cls) -> List:
    return []

  def __TargetedSetAttr__(self,value, fieldName, fieldType):
    fieldValType = type(value)
    if fieldType == date:
      if fieldValType == str:
        self.__setattr__(fieldName, toDate(value))
      if fieldValType == date:
        self.__setattr__(fieldName, value)
      if fieldValType == datetime:
        self.__setattr__(fieldName, value.date())
    elif fieldType == datetime:
      if fieldValType == str:
        try:
          self.__setattr__(fieldName, toDateTime(value))
        except ValueError:
          self.__setattr__(fieldName, toDateTime(value, Format=JSON_DATETIME_FORMAT))
    elif fieldType == time:
      self.__setattr__(fieldName, toTime(value))
    elif fieldType == int:
      if fieldValType == type(None):
        self.__setattr__(fieldName, 0)
      elif fieldValType == str:
        try:
          self.__setattr__(fieldName, int(value))
        except ValueError as E:
          errorMessage = f"""In the construction of the Class {self.__class__} The Field: {fieldName} was Assigned the string {value}
            The dataclass cannot nativily convert this to {fieldType}"""
          raise TypeError(errorMessage)
      else:
        try:
          self.__setattr__(fieldName, fieldType(value))
        except ValueError:
          ErrorMessage = f"""In the construction of the Class {self.__class__} The Field: {fieldName} was Assigned a object of type: {type(value)}
            The dataclass cannot nativily convert this to {fieldType}"""
          raise TypeError(ErrorMessage)
    else:
      try:
        self.__setattr__(fieldName, fieldType(value))
      except ValueError:
        ErrorMessage = f"""In the construction of the Class {self.__class__} The Field: {fieldName} was Assigned a object of type: {type(value)}
          The dataclass cannot nativily convert this to {fieldType}"""
        raise TypeError(ErrorMessage)

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
    if fieldValType == field.type or isinstance(fieldVal, field.type):
      self.__setattr__(field.name, fieldVal)
    elif get_origin(field.type) == Union:
      for UnionType in get_args(field.type):
        if UnionType == NoneType:
          continue
        try:
          self.__TargetedSetAttr__(fieldVal, field.name, UnionType)
        except TypeError:
          pass
      if not hasattr(self, field.name):
        errorMessage = f"""In the construction of the Class {self.__class__} The Field: {field.Name} was Assigned the Value: {fieldVal}
            However The dataclass cannot nativily convert this to one of the types {get_args(field.type)}"""
        raise TypeError(errorMessage)
    else:
      self.__TargetedSetAttr__(fieldVal, field.name, field.type)

  def __init__(self, *args, **kwargs):
    Myfields = self.getFields()
    fieldDict = { field.name : field for field in Myfields}

    #Initialize Optionals as None
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
        if fieldName.startswith("TIME_FORMAT("): # The Keyword is hidden in a some formatting
          formattedStr, _ = fieldName.split(",", 1)
          fieldName = formattedStr[12:]
          if field := fieldDict.get(fieldName):
            self.__TypeSafeSetAttr(field, fieldVal)
          else:
            ErrorString = f"In the construction of the Class {self.__class__} an Unknown keyword in construction:{fieldName} was encountered"
            raise KeyError(ErrorString)
        else:
          ErrorString = f"In the construction of the Class {self.__class__} an Unknown keyword in construction:{fieldName} was encountered"
          raise KeyError(ErrorString)

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
  tracer : int
  run : int
  BID : int
  batchnr : str
  COID : int
  frigivet_af : Optional[int] #id matching to OldDatabaseID
  frigivet_amount : Optional[int]
  volume : Optional[float]
  frigivet_datetime : Optional[datetime]
  comment : Optional[str]
  username : Optional[str]

  @classmethod
  def getSQLTable(cls):
    return "orders"

  @classmethod
  def getSQLDateTime(cls) -> str:
    return "deliver_datetime"

  @classmethod
  def getIDField(cls) -> str:
    return "oid"

  @classmethod
  def getExtraFields(cls) -> List:
    return ["COID", "status", "batchnr"]

  @classmethod
  def getExtraValues(cls) -> List:
    return ["-1", "2", "\"\""]

@dataclass(init=False)
class InjectionOrderDataClass(JsonSerilizableDataClass):
  deliver_datetime : datetime
  oid : int
  status : int
  n_injections : int
  anvendelse : str
  comment : str
  username : str
  tracer : int
  BID    : int
  batchnr : str
  frigivet_af : Optional[int]
  frigivet_datetime : Optional[datetime]

  @classmethod
  def getSQLTable(cls) -> str:
    return "t_orders"

  @classmethod
  def getSQLDateTime(cls) -> str:
    return "deliver_datetime"

  @classmethod
  def getIDField(cls) -> str:
    return "oid"

  @classmethod
  def getExtraFields(cls) -> List:
    return ["status"]

  @classmethod
  def getExtraValues(cls) -> List:
    return ["2"]

@dataclass(init=False)
class VialDataClass(JsonSerilizableDataClass):
  customer : int
  charge : str
  filldate : date
  filltime : time
  volume : float
  activity : float
  ID : int
  order_id : Optional[int]

  @classmethod
  def getSQLFields(cls) -> str:
    return """customer,
      charge,
      filldate,
      TIME_FORMAT(filltime, \"%T\"),
      volume,
      activity,
      ID,
      order_id"""

  @classmethod
  def getSQLTable(cls) -> str:
    return "VAL"

  @classmethod
  def getSQLDateTime(cls) -> str:
    return "filldate"

  @classmethod
  def getIDField(cls) -> str:
    return "ID"

@dataclass(init=False)
class TracerCustomerMappingDataClass(JsonSerilizableDataClass):
  tracer_id : int
  customer_id : int
  ID : int

  @classmethod
  def getSQLTable(cls) -> str:
    return "TracerCustomer"

  @classmethod
  def getIDField(cls) -> str:
    return "ID"

@dataclass(init=False)
class DeliverTimeDataClass(JsonSerilizableDataClass):
  BID : int
  day : int
  repeat_t : int
  dtime : time
  run : int
  DTID : int

  @classmethod
  def getSQLTable(cls):
    return "deliverTimes"

  @classmethod
  def getSQLFields(cls):
    return """BID,
      day,
      repeat_t,
      TIME_FORMAT(dtime, \"%T\"),
      run,
      DTID"""

  @classmethod
  def getIDField(cls) -> str:
    return "DTID"

@dataclass(init=False)
class RunsDataClass(JsonSerilizableDataClass):
  day : int
  ptime : time
  run : int
  PTID : int

  @classmethod
  def getSQLTable(cls):
    return "productionTimes"

  @classmethod
  def getSQLFields(cls):
    return """day,
      TIME_FORMAT(ptime, \"%T\"),
      run,
      PTID"""

  @classmethod
  def getIDField(cls) -> str:
    return "PTID"

@dataclass(init=False)
class IsotopeDataClass(JsonSerilizableDataClass):
  ID : int
  name : str
  halflife : float

  @classmethod
  def getSQLTable(cls):
    return "isotopes"

  @classmethod
  def getIDField(cls) -> str:
    return "ID"


@dataclass(init=False)
class TracerDataClass(JsonSerilizableDataClass):
  id : int
  name : str
  isotope : int
  n_injections : int
  order_block : int
  in_use : bool
  tracer_type : int
  longName : str

  @classmethod
  def getSQLTable(cls):
    return "Tracers"

  @classmethod
  def getIDField(cls) -> str:
    return "id"

@dataclass(init=False)
class CustomerDataClass(JsonSerilizableDataClass):
  UserName : str
  ID : int
  overhead : int
  kundenr : int
  Realname : str
  email : str
  email2 : str
  email3 : str
  email4 : str
  contact : str
  tlf : int
  addr1 : str
  addr2 : str
  addr3 : str
  addr4 : str

  @classmethod
  def getSQLFields(cls):
    fieldsNames = cls.getFields()
    UpdatedFieldNames = LMAP(lambda field: "Users." + field, [field.name for field in fieldsNames])

    return ", ".join(UpdatedFieldNames)

  @classmethod
  def createDataClassQuery(cls, skeleton) -> str:
    Fields = []
    Values = []

    for (k, v) in skeleton.items():
      Fields.append(k)
      Values.append(SerilizeToSQLValue(v))

    return f"""INSERT INTO Users({
      ", ".join(map(str, Fields))}) VALUES ({", ".join(map(str,Values))})"""

  @staticmethod
  def getSQLTable():
    return "Users INNER JOIN UserRoles on Users.Id = UserRoles.Id_User"

  @staticmethod
  def getSQLWhere():
    return "UserRoles.Id_Role = 4 AND Users.kundenr IS NOT NULL"

  @classmethod
  def getIDField(cls) -> str:
    return "ID"

@dataclass(init=False)
class EmployeeDataClass(JsonSerilizableDataClass):
  #This datacase is not a datastruct from the old but instead is technically a user
  Username : str
  Id : int

  @staticmethod
  def getSQLTable():
    return "Users"

  @classmethod
  def fromUser(cls, user: User):
    return cls(Username=user.username, Id=user.OldTracerBaseID)

@dataclass(init=False)
class ClosedDateDataClass(JsonSerilizableDataClass):
  BDID : int
  ddate : date

  @staticmethod
  def getSQLTable() -> str:
    return "blockDeliverDate"

  @staticmethod
  def getIDField() -> str:
    return "BDID"

  @staticmethod
  def getSQLDateTime() -> str:
    return "ddate"

DATACLASSES = {
    JSON_ACTIVITY_ORDER : ActivityOrderDataClass,
    JSON_CUSTOMER : CustomerDataClass,
    JSON_CLOSEDDATE : ClosedDateDataClass,
    JSON_DELIVERTIME : DeliverTimeDataClass,
    JSON_ISOTOPE : IsotopeDataClass,
    JSON_INJECTION_ORDER : InjectionOrderDataClass,
    JSON_RUN : RunsDataClass,
    JSON_TRACER : TracerDataClass,
    JSON_TRACER_MAPPING : TracerCustomerMappingDataClass,
    JSON_VIAL : VialDataClass
  }

# Data class constant mapping
def findDataClass(dataType: str) -> type:
  """Mapping of the string identifiers and production-data-class-types
    Raises ValueError if data class not found.

  Args:
      dataType (str): JSON_XXX matching a 

  Raises:
      ValueError: _description_

  Returns:
      type: _description_
  """
  dataClass = DATACLASSES.get(dataType)

  if dataClass == None: # This is a handy way to see if i've set up a dataclass for the data type
    raise ValueError(f"Datatype: {dataType} is unknown to the consumer")

  return dataClass

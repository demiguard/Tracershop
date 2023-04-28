"""This module creates a subclass that allows the dataclass to converted to
json format, for the purposes of sending them over the websocket"""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from dataclasses import asdict, dataclass, Field, fields
from datetime import datetime, date, time
from typing import Any, Dict, get_args, get_origin, Type, Union
# Third party packages

# Tracershop production packages
from constants import JSON_DATETIME_FORMAT
from lib.Formatting import toDate, toDateTime, toTime

@dataclass(init=False)
class TypeSafeJsonDataclass():
  """This class ensure that the dataclass can be serialized and is type safe
  It's the button of the chain
  """
  def toJSON(self) -> Dict[str, Any]:
    """Convert dataclass to a JSON dict"""
    return asdict(self)

  @classmethod
  def fromJSON(cls, inputDict: Dict[str, Any]):
    return cls(**inputDict)

  @classmethod
  def getFields(cls):
    return fields(cls)

  def __TargetedSetAttr(self, field: Field, fieldValue: Any, fieldType: Type):
    fieldValType = type(fieldValue)
    if fieldType == date:
      if fieldValType == str:
        self.__setattr__(field.name, toDate(fieldValue))
      if fieldValType == date:
        self.__setattr__(field.name, fieldValue)
      if fieldValType == datetime:
        self.__setattr__(field.name, fieldValue.date())
    elif fieldType == datetime:
      if fieldValType == str:
        try:
          self.__setattr__(field.name, toDateTime(fieldValue))
        except ValueError:
          self.__setattr__(field.name, toDateTime(fieldValue, Format=JSON_DATETIME_FORMAT))
    elif fieldType == time:
      self.__setattr__(field.name, toTime(fieldValue))
    elif fieldType == int:
      if fieldValType == type(None):
        self.__setattr__(field.name, 0)
      elif fieldValType == str:
        try:
          self.__setattr__(field.name, int(fieldValue))
        except ValueError as E:
          errorMessage = f"""In the construction of the Class {self.__class__} The Field: {field.name} was Assigned the string {fieldValue}
            The dataclass cannot nativity convert this to {fieldType}"""
          raise TypeError(errorMessage)
      else:
        try:
          self.__setattr__(field.name, fieldType(fieldValue))
        except ValueError:
          ErrorMessage = f"""In the construction of the Class {self.__class__} The Field: {field.name} was Assigned a object of type: {type(fieldValue)}
            The dataclass cannot nativity convert this to {fieldType}"""
          raise TypeError(ErrorMessage)
    else:
      try:
        self.__setattr__(field.name, fieldType(fieldValue))
      except ValueError:
        ErrorMessage = f"""In the construction of the Class {self.__class__} The Field: {field.name} was Assigned a object of type: {type(fieldValue)}
          The dataclass cannot nativity convert this to {fieldType}"""
        raise TypeError(ErrorMessage)

  def __TypeSafeSetAttr(self, field: Field, fieldVal : Any) -> None:
    """This function attempts to set a field after performing type checking.
    If Typechecking fails, it will attempt to perform some conversion between
    input type and the designated type

    Args:
      self (JsonSerilizableDataclass): The object where an attribute is set
      field (dataclass.Field): The field that is being set
      fieldVal (Any): The value that will be set, it's not on type field.type
                      then it will be converted or raise a TypeError

    Raises:
      TypeError: When type conversion of a field fails.
    """
    if get_origin(field.type == Union):
      for fieldType in get_args(field.type):
        if isinstance(fieldVal, fieldType):
          self.__TargetedSetAttr(field, fieldVal, fieldType)
          break
    else:
      self.__TargetedSetAttr(field, fieldVal, field.type)

    if not hasattr(self, field.name):
      errorMessage = f"""In the construction of the Class {self.__class__} The Field: {field.name} was Assigned the Value: {fieldVal}
        However The dataclass cannot nativity convert this to one of the types {get_args(field.type)}"""
      raise TypeError(errorMessage)


  def __init__(self, *args, **kwargs) -> None:
    # set fields
    self.__fieldDict = {field.name : field  for field in self.getFields()}

    # Initialize optional elements
    for field in self.__fieldDict.values():
      if get_origin(field.type) == Union and type(None) in get_args(field.type):
        self.__setattr__(field.name, None)

    # Set keyword-less args
    # Note here we take advantage of zip short circuiting
    # Example
    # >>>for i,j in zip([1,2],[3]):
    # >>>  print(i,j)
    # 1,3
    for field, fieldVal in zip(self.__fieldDict.values(), args):
      self.__TypeSafeSetAttr(field, fieldVal)

    for keyword, keywordValue in kwargs:
      field = self.__fieldDict[keyword] # Raises KeyError on miss
      self.__TypeSafeSetAttr(field, keywordValue)

  def __post_init__(self):
    for field in fields(self):
      attrType = type(self.__getattribute__(field.name))
      if attrType == field.type:
        continue
      if get_origin(field.type) == Union:
        if attrType in get_args(field.type):
          continue
      raise TypeError(f"""The Field: {field.name} was Assigned a object of type: {type(self.__getattribute__(field.name))}
        The dataclass cannot nativity convert this to {field.type}""")

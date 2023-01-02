"""
  This file contains all the SQL-queries executed by the SQL controller
  This is an extention file to the SQLController
"""
__author__ = "Christoffer Vilstrup Jensen"

from constants import USAGE

from typing import Type, List, Union, Any, Tuple
from datetime import date, time, datetime
from dataclasses import fields

from lib.decorators import typeCheckFunc
from lib.SQL.SQLFormatter import SerializeToSQLValue
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, IsotopeDataClass, RunsDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass
from lib.Formatting import dateConverter, mergeDateAndTime
from lib.utils import LMAP

from database.models import User

def getElement(ID: int, dataClass) -> str:
  Query = f"""SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    Where
      {dataClass.getIDField()}={ID}"""
  return Query

def getDataClass(dataClass) -> str:
  # Note that in most cases where there's no internal filter then SQLWhere
  # just returns TRUE ie: All elements of the class
  return  f"""SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    WHERE
      {dataClass.getSQLWhere()}"""

def UpdateJsonDataClass(DataClassObject: Type[JsonSerilizableDataClass]) -> str:
  """Creates an string with a SQL Query for Updating an JsonSerilizableDataClass
     so that's matching to the input object.

  Args:
      DataClassObject (JsonSerilizableDataClass): _description_
  Returns:
      string with a SQL Query for Updating an JsonSerilizableDataClass
  """
  try:
    ID = getattr(DataClassObject, DataClassObject.getIDField())
  except AttributeError as E:
    raise E
  updateFields = []

  for field in DataClassObject.getFields():
    if field.name == DataClassObject.getIDField():
      continue
    FieldValue = getattr(DataClassObject, field.name)
    if FieldValue == None:
      continue
    updateFields.append((field.name, SerializeToSQLValue(FieldValue)))

  updateString = ""

  for i, (field, value) in enumerate(updateFields):
    if i + 1 == len(updateFields):
      updateString +=f"{field}={value}"
    else:
      updateString +=f"{field}={value},\n"

  IDstring = f"{DataClassObject.getIDField()}={ID}"

  returnstr = f"""UPDATE {DataClassObject.getSQLTable()}
    SET
      {updateString}
    WHERE
      {IDstring}"""

  return returnstr

def authenticateUser(username: str, password: str) -> str:
  Query = f"""SELECT
      Username,
      Id
    FROM
      Users
    WHERE
      Username={SerializeToSQLValue(username)} AND
      Password={SerializeToSQLValue(password)}"""

  return Query

def FreeDependantOrders(Order: ActivityOrderDataClass, user: User) -> str:
  return f"""UPDATE orders
  SET
    status=3,
    frigivet_af={user.OldTracerBaseID},
    frigivet_datetime={SerializeToSQLValue(datetime.now())}
  WHERE
    COID={Order.oid}"""

def getRelatedOrders(Order: ActivityOrderDataClass) -> str:
  return f"""SELECT
      {Order.getSQLFields()}
    FROM
      orders
    WHERE
      COID={Order.oid}"""

def getLastElement(DataClass : JsonSerilizableDataClass) -> str:
  return f"""SELECT
      {DataClass.getSQLFields()}
    FROM
     {DataClass.getSQLTable()}
    WHERE
      {DataClass.getIDField()} = (
        SELECT
          MAX({DataClass.getIDField()})
        FROM {DataClass.getSQLTable()}
      )"""


@typeCheckFunc
def getDataClassRange(startDate: Union[datetime, date], endDate : Union[datetime, date], DataClass) -> str:
  return f"""SELECT
      {DataClass.getSQLFields()}
    FROM
      {DataClass.getSQLTable()}
    WHERE
      {DataClass.getSQLDateTime()} BETWEEN {
        SerializeToSQLValue(startDate)} AND {SerializeToSQLValue(endDate)}"""

def deleteIDs(ids : List[int], DataClass : JsonSerilizableDataClass) -> str:
  idsStr = ", ".join(LMAP(str,ids)) # types are callable
  return f"""DELETE FROM {DataClass.getSQLTable()}
    WHERE {DataClass.getIDField()} IN ({idsStr})"""

def GetConditionalElements(condition: str, dataClass : JsonSerilizableDataClass):
  Query = f"""SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    WHERE
      {condition}"""
  return Query

def tupleInsertQuery(TupleList : List[Tuple[str, Any]], Table : str) -> str:
  """Fancy way of creating an insert Query.
  This function creates an insert query where it's easy to see the value pairs of items.

  Note the query is not very human readable

  Args:
      TupleList (List[Tuple[str, Any]]): _description_
      Table (str): _description_

  Returns:
      str: _description_
  """

  columnString = ""
  valueString = ""

  for i, (column, value) in enumerate(TupleList):
    columnString += column
    valueString += str(SerializeToSQLValue(value))
    if i != len(TupleList) - 1:
      columnString += ", "
      valueString += ", "

  return f"""INSERT INTO {Table} ({columnString}) VALUES ({valueString})"""

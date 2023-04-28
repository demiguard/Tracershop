"""This module is responsible for overseeing all data transfers between databases and the server
  This Module is that have been modified into a class for depency injections sake.
  So that this module can easily be replaced if one decide to change the underlying database
  This is also helpful for testing sake.
"""
__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import datetime, date
from typing import Callable, Dict, List, Optional, Tuple, Type, Union

# Third party Packages
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Model
from django.db.models.query import QuerySet

# Tracershop Production packages
from database.models import ServerConfiguration, Database, User
from database.production_database.SQLExecuter import Fetching
from database.production_database import SQLFormatter, SQLExecuter, SQLFactory
from dataclass.ProductionDataClasses import ActivityOrderDataClass, EmployeeDataClass, JsonSerilizableDataClass


class SQL():
  """
    This is a stateless class, that is meant to be injected into a database using class,
    thus allowing mocking in testing.
  """

  @staticmethod
  def __Execute(
      SQLFactoryMethod : Callable[..., str],
      returnClass : Type[JsonSerilizableDataClass],
      fetch : Fetching, *args) -> List[JsonSerilizableDataClass]:
    """This is the method for executing a single SQL statement transaction

    Args:
        SQLFactoryMethod (Callable[..., str]): _description_
        returnClass (JsonSerilizableDataClass): _description_
        Fetch : Fetching enum Value
    Returns:
        List[JsonSerilizableDataClass]: _description_
    """
    SQLQuery = SQLFactoryMethod(*args)
    SQLResult = SQLExecuter.ExecuteQuery(SQLQuery, fetch=fetch)

    if SQLResult:
      if fetch == Fetching.ALL:
        return SQLFormatter.FormatSQLDictAsClass(SQLResult, returnClass)
      elif fetch == Fetching.ONE:
        return [returnClass(**SQLResult)]

    return []

  @staticmethod
  def __ExecuteMany(
      SQLFactoryMethods : List[Callable[..., str]],
      returnClass : JsonSerilizableDataClass,
      fetch : Fetching,
      args : List) -> List[JsonSerilizableDataClass]:
    Queries = [method(*arg) for method, arg in zip(SQLFactoryMethods, args)]
    SQLResult = SQLExecuter.ExecuteManyQueries(Queries, fetch=fetch)
    if SQLResult:
      if fetch == Fetching.ALL:
        return SQLFormatter.FormatSQLDictAsClass(SQLResult, returnClass)
      elif fetch == Fetching.ONE:
        return [returnClass(**SQLResult)]

    return []
  # Get methods
  ##### Universal methods #####
  @classmethod
  def getModels(cls, model) -> QuerySet[Model]:
    """gets a list of models.

    Programmers note: Don't convert the QuerySet to a list, since a QuerySet acts as a list,
    hence converting it to a list is just a waste of clock cycles.

    Args:
        model django.db.models.Model: The models where you wish all models
    Returns:
        QuerySet[Model] - This is effectivly a list, with some bonus stuff.
    """
    return model.objects.all()

  @classmethod
  def getElement(cls, ID:int, Dataclass: Type[JsonSerilizableDataClass]) -> Optional[JsonSerilizableDataClass]:
    returnList = cls.__Execute(SQLFactory.getElement, Dataclass, Fetching.ONE, ID, Dataclass)
    if returnList:
      return returnList[0]
    else:
      None

  @classmethod
  def getConditionalElement(cls, condition : str, dataClass: Type[JsonSerilizableDataClass]):
    returnList = cls.__Execute(SQLFactory.GetConditionalElements, dataClass, Fetching.ONE, condition, dataClass)
    if returnList:
      return returnList[0]
    else:
      None

  @classmethod
  def getConditionalElements(cls, condition : str, dataClass: Type[JsonSerilizableDataClass]):
    return cls.__Execute(SQLFactory.GetConditionalElements, dataClass, Fetching.ALL, condition, dataClass)

  @classmethod
  def UpdateJsonDataClass(cls, DataClassObject: Type[JsonSerilizableDataClass]):
    cls.__Execute(SQLFactory.UpdateJsonDataClass, JsonSerilizableDataClass, Fetching.NONE, DataClassObject)

  @classmethod
  def getDataClass(cls, DataClass) -> List[JsonSerilizableDataClass]:
    return cls.__Execute(SQLFactory.getDataClass, DataClass, Fetching.ALL, DataClass)

  @classmethod
  def getDataClassRange(cls,
                        startDate: Union[datetime, date],
                        endDate : Union[datetime, date],
                        DataClass):
    return cls.__Execute(
      SQLFactory.getDataClassRange,
      DataClass, Fetching.ALL,
      startDate, endDate, DataClass)

  @classmethod
  def createDataClass(cls, skeleton : Dict, DataClass) -> JsonSerilizableDataClass:
    returnList = cls.__ExecuteMany(
      [DataClass.createDataClassQuery, SQLFactory.getLastElement],
      DataClass, Fetching.ONE, [[skeleton], [DataClass]]
    )
    return returnList[0]


  # Get methods from django Database
  @staticmethod
  def getServerConfig() -> ServerConfiguration:
    try:
      ServerConfig = ServerConfiguration.objects.get(ID=1)
    except ObjectDoesNotExist:
      Databases    = Database.objects.all()
      ServerConfig = ServerConfiguration(ID=1, ExternalDatabase=Databases[0])
      ServerConfig.save()

    return ServerConfig

  @classmethod
  def getEmployees(cls):
    """Get the employes, Note that this class have their data dublicated with in the old database and the new one.
    This data dublication should only last until BAM ID login is integrated, at which point the connection to the old DB should be cut.

    Returns:
        List[EmployeeDataClass]: The list of all users
    """
    return [EmployeeDataClass.fromUser(user) for user in User.objects.all()]


  @classmethod
  def freeDependantOrder(
      cls,
      OriginalOrder : ActivityOrderDataClass,
      user : User
    ) -> List[ActivityOrderDataClass]:
    return cls.__ExecuteMany(
      [SQLFactory.FreeDependantOrders, SQLFactory.getRelatedOrders],
      ActivityOrderDataClass, Fetching.ALL,
      [[OriginalOrder, user],[OriginalOrder]]
    )


  @classmethod
  def authenticateUser(cls, username:str, password:str) -> Optional[EmployeeDataClass]:
    try:
      Employee = cls.__Execute(SQLFactory.authenticateUser, EmployeeDataClass, Fetching.ONE, username, password)[0]
    except IndexError:
      return None
    return Employee

  @classmethod
  def deleteIDs(cls, ids, DataClass):
    cls.__Execute(SQLFactory.deleteIDs, JsonSerilizableDataClass, Fetching.NONE, ids, DataClass)

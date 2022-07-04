"""
  This module is responsible for overseeing all data transfers between databases and the server
  This Module is that have been modified into a class for depency injections sake.
  So that this module can easily be replaced if one decide to change the underlying database
  This is also helpful for testing sake.
"""
__author__ = "Christoffer Vilstrup Jensen"

from django.db.models import Model
from django.db.models.base import ModelBase
from django.db.models.query import QuerySet
from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from dataclasses import fields
from datetime import datetime, time, date
from typing import Callable, Dict, List, Optional, Tuple, Type


from api.models import ServerConfiguration, Database
from lib.decorators import typeCheckfunc
from lib.SQL.SQLExecuter import Fetching
from lib.SQL import SQLFormatter, SQLExecuter, SQLFactory
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, JsonSerilizableDataClass,RunsDataClass, TracerDataClass,  VialDataClass
from lib.utils import LMAP

from TracerAuth.models import User

class SQL():
  """
    This is a stateless class, that is meant to be injected into a database using class,
    thus allowing mocking in testing.
  """

  @staticmethod
  def __Execute(
      SQLFactoryMethod : Callable[..., str],
      returnClass : JsonSerilizableDataClass,
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
        return SQLFormatter.FormatSQLTupleAsClass(SQLResult, returnClass)
      elif fetch == Fetching.ONE:
        return [returnClass(*SQLResult)]
      else:
        return []
    else:
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
        return SQLFormatter.FormatSQLTupleAsClass(SQLResult, returnClass)
      elif fetch == Fetching.ONE:
        return [returnClass(*SQLResult)]
      else:
        return []
    else:
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
  def getElement(cls, ID:int, Dataclass) -> Optional[JsonSerilizableDataClass]:
    returnList = cls.__Execute(SQLFactory.getElement, Dataclass, Fetching.ONE, ID, Dataclass)
    if returnList:
      return returnList[0]
    else:
      None

  @classmethod
  def UpdateJsonDataClass(cls, DataClassObject : JsonSerilizableDataClass):
    cls.__Execute(SQLFactory.UpdateJsonDataClass, JsonSerilizableDataClass, Fetching.NONE, DataClassObject)

  @classmethod
  def getDataClass(cls, DataClass) -> List[JsonSerilizableDataClass]:
    return cls.__Execute(SQLFactory.getDataClass, DataClass, Fetching.ALL, DataClass)

  @classmethod
  def getDataClassRange(cls, startDate: datetime, endDate : datetime, DataClass):
    return cls.__Execute(
      SQLFactory.getDataClassRange,
      DataClass, Fetching.ALL,
      startDate, endDate, DataClass)

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
        _type_: _description_
    """
    return LMAP(EmployeeDataClass.fromUser, User.objects.all())

  @classmethod
  def createVial(cls, Vial : VialDataClass) -> VialDataClass:
    """This takes a vial skeleton and creates it in the database.
      Then it fetches it and creates a updated Vial

    Args:
        Vial (VialDataClass): Vial to saved to database
    """
    returnList = cls.__ExecuteMany(
      [SQLFactory.InsertVial, SQLFactory.getLastElement],
      VialDataClass, Fetching.ONE, [[Vial],[VialDataClass]]
    )
    return returnList[0]


  @classmethod
  def FreeOrder(
    cls,
    Order: ActivityOrderDataClass,
    Vial: VialDataClass,
    user: User) -> List[ActivityOrderDataClass]:
    """[summary]

    Args:
        Order (ActivityOrderDataClass): [description]
        Vial (VialDataClass): [description]

    Returns:
        List[ActivityOrderDataClass]: [description]
    """
    return cls.__ExecuteMany(
      [ SQLFactory.FreeExistingOrder,
        SQLFactory.FreeDependantOrders,
        SQLFactory.CreateVialMapping,
        SQLFactory.getRelatedOrders],
      ActivityOrderDataClass,
      Fetching.ALL,
      [[Order, Vial, user],[Order, user], [Order, Vial], [Order]])

  @classmethod
  def CreateNewFreeOrder(
      cls,
      OriginalOrder : ActivityOrderDataClass,
      Vial : VialDataClass,
      tracerID :int,
      user : User
    ) -> ActivityOrderDataClass:
    lastOrderList = cls.__ExecuteMany(
      [SQLFactory.createLegacyFreeOrder, SQLFactory.getLastElement],
      ActivityOrderDataClass, Fetching.ONE,
      [[OriginalOrder, Vial, tracerID, user],[ActivityOrderDataClass]]
    )
    lastOrder = lastOrderList[0]
    # This should technically be a part of the last transaction and therefore does give a race condition,
    # However such a race condition is rare, since it's in a low throughput server
    # Also in the case where the race condition happens aka the vial appears unused while in truth it's used.
    cls.__Execute(
      SQLFactory.CreateVialMapping,
      JsonSerilizableDataClass,
      Fetching.NONE, lastOrder, Vial
    )
    return lastOrder

  @classmethod
  def authenticateUser(cls, username:str, password:str) -> Optional[EmployeeDataClass]:
    return cls.__Execute(SQLFactory.authenticateUser, EmployeeDataClass, Fetching.ONE, username, password)

  @classmethod
  def productionCreateOrder(
    cls,
    deliver_datetime : datetime,
    Customer : CustomerDataClass,
    amount : float,
    amount_overhead : float,
    tracer : TracerDataClass,
    run : int,
    username : str
  ) -> ActivityOrderDataClass:
    lastOrderList = cls.__ExecuteMany(
      [SQLFactory.productionCreateOrder,SQLFactory.getLastElement],
      ActivityOrderDataClass, Fetching.ONE,
      [[deliver_datetime, Customer, amount, amount_overhead, tracer, run, username],
      [ActivityOrderDataClass]])
    return lastOrderList[0]

  @classmethod
  def createGhostOrder(
    cls,
    deliver_datetime : datetime,
    Customer : CustomerDataClass,
    amount_total : float,
    amount_total_overhead : float,
    tracer : TracerDataClass,
    run : int,
    username : str
  ):
    """ This function creates an empty order,
    this should be invoked when a user moves an order from a time slot with out an order existsing
    """
    GhostOrderList = cls.__ExecuteMany(
      [SQLFactory.createGhostOrder, SQLFactory.getLastElement],
      ActivityOrderDataClass, Fetching.ONE,
      [[deliver_datetime, Customer, amount_total, amount_total_overhead, tracer, run, username],
        [ActivityOrderDataClass]] )
    return GhostOrderList[0]

  @classmethod
  def deleteIDs(cls, ids, DataClass):
    cls.__Execute(SQLFactory.deleteIDs, JsonSerilizableDataClass, Fetching.NONE, ids, DataClass)

  @classmethod
  def createInjectionOrder(cls,
    Customer : CustomerDataClass,
    Tracer : TracerDataClass,
    deliver_datetime : datetime,
    n_injections : int,
    usage : int,
    comment : str,
    user
  ) -> InjectionOrderDataClass:
    InjectionOrderList = cls.__ExecuteMany(
      [SQLFactory.createInjectionOrder, SQLFactory.getLastElement],
      InjectionOrderDataClass, Fetching.ONE,
      [[Customer, Tracer, deliver_datetime, n_injections, usage, comment, user],
        [InjectionOrderDataClass]
      ]
    )
    return InjectionOrderList[0]
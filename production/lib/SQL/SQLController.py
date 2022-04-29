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
from lib.SQL import SQLFormatter, SQLExecuter, SQLFactory
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, JsonSerilizableDataClass,RunsDataClass, TracerDataClass,  VialDataClass
from lib.utils import LMAP

from TracerAuth.models import User

class SQL():
  """
    This is a stateless class, that is meant be injected into something, thus allowing for testing
    One can later use depency injection to change this
  """

  @staticmethod
  def __ExecuteNoReturn(SQLFactoryMethod: Callable[..., str], *args) -> None:
    """This function takes a method and arguments to that method. The method must produce a valid SQL query
    That is executed by this function. The query must have no return values such as updates and insert Queries

    Note:
      These methods should be found in SQLFactory module found in /production/lib/SQL/SQLFactory.py

    Args:
        SQLFactoryMethod (Callable[..., str]): Method that produces a SQL query
        *Args : Args for SQLFactoryMethod
    """
    SQLQuery = SQLFactoryMethod(*args)
    SQLExecuter.ExecuteQuery(SQLQuery)

  @staticmethod
  def __ExecuteReturnOne(SQLFactoryMethod : Callable[..., str], returnClass : JsonSerilizableDataClass, *args, **kwargs) -> Optional[JsonSerilizableDataClass]:
    """This function is the control function for making a query, taking one row,
    converting that into a dataclass and then returning it

    Args:
        SQLFactoryMethod (Callable[..., str]): This is the method, that generates the query
        returnClass (JsonSerilizableDataClass): This is the return class,
                    Note it shouldn't be an instance, only the type of class
        *args: additional args are passed to SQLFactoryMethod
        **kwargs: additional kwargs are passed to SQLFactoryMethod

    Returns:
        Optional[JsonSerilizableDataClass]: If the underlying query returned a result,
          then it's converted to JsonSerilizableDataClass if no result was found, it returns None
    """
    SQLQuery = SQLFactoryMethod(*args, **kwargs)
    SQLTuple = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
    if SQLTuple:
      return returnClass(*SQLTuple)
    else:
      return None

  @staticmethod
  def __ExecuteReturnMany(SQLFactoryMethod : Callable[..., str], returnClass : JsonSerilizableDataClass, *args) -> List[JsonSerilizableDataClass]:
    """_summary_

    Args:
        SQLFactoryMethod (Callable[..., str]): _description_
        returnClass (JsonSerilizableDataClass): _description_

    Returns:
        List[JsonSerilizableDataClass]: _description_
    """
    SQLQuery = SQLFactoryMethod(*args)
    SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)
    if SQLResult:
      return SQLFormatter.FormatSQLTupleAsClass(SQLResult, returnClass)
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
    return cls.__ExecuteReturnOne(SQLFactory.getElement, Dataclass, ID, Dataclass)

  @classmethod
  def UpdateJsonDataClass(cls, DataClassObject : JsonSerilizableDataClass):
    cls.__ExecuteNoReturn(SQLFactory.UpdateJsonDataClass, DataClassObject)

  @classmethod
  def getDataClass(cls, DataClass) -> List[JsonSerilizableDataClass]:
    return cls.__ExecuteReturnMany(SQLFactory.getDataClass, DataClass, DataClass)

  @classmethod
  def getDataClassRange(cls, startDate: datetime, endDate : datetime, DataClass):
    return cls.__ExecuteReturnMany(SQLFactory.getDataClassRange, DataClass, startDate, endDate, DataClass)

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
  def createVial(cls, Vial : VialDataClass) -> None:
    """[summary]

    Args:
        Vial (VialDataClass): Vial to saved to database
    """
    cls.__ExecuteNoReturn(SQLFactory.InsertVial, Vial)


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
    cls.__ExecuteNoReturn(SQLFactory.FreeExistingOrder, Order, Vial, user)
    cls.__ExecuteNoReturn(SQLFactory.FreeDependantOrders, Order, user)
    cls.__ExecuteNoReturn(SQLFactory.CreateVialMapping, Order, Vial)
    return cls.__ExecuteReturnMany(SQLFactory.getRelatedOrders, ActivityOrderDataClass, Order)

  @classmethod
  def CreateNewFreeOrder(
      cls,
      OriginalOrder : ActivityOrderDataClass,
      Vial : VialDataClass,
      tracerID :int,
      user : User
    ) -> ActivityOrderDataClass:
    cls.__ExecuteNoReturn(SQLFactory.createLegacyFreeOrder, OriginalOrder, Vial, tracerID, user)
    lastOrder = cls.__ExecuteReturnOne(SQLFactory.getLastOrder, ActivityOrderDataClass)
    cls.__ExecuteNoReturn(SQLFactory.CreateVialMapping, lastOrder, Vial)
    return lastOrder

  @classmethod
  def authenticateUser(cls, username:str, password:str) -> Optional[EmployeeDataClass]:
    return cls.__ExecuteReturnOne(SQLFactory.authenticateUser, EmployeeDataClass, username, password)

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
  ):
    cls.__ExecuteNoReturn(SQLFactory.productionCreateOrder, deliver_datetime, Customer, amount, amount_overhead, tracer, run, username)
    return cls.__ExecuteReturnOne(SQLFactory.getLastOrder, ActivityOrderDataClass)

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
    cls.__ExecuteNoReturn(SQLFactory.createGhostOrder, deliver_datetime, Customer, amount_total, amount_total_overhead, tracer, run, username)
    return cls.__ExecuteReturnOne(SQLFactory.getLastOrder, ActivityOrderDataClass)

  @classmethod
  def deleteActivityOrders(cls, oids_to_delete):
    cls.__ExecuteNoReturn(SQLFactory.deleteActivityOrder, oids_to_delete)

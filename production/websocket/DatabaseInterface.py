

"""
  This class is support to contain all the functions,
  that makes SQL calls to the database. This is in an attempt to clean up the Consumer
  as it will get bloated with code otherwise.

  Most of this code is simply just an way to put the decorator on top.
  Really there shouldn't be too much code down here, however it'll save you a few hundred lines in Real consumer
"""

__author__ = "Christoffer Vilstrup Jensen"

from django.db.models import Model, ForeignKey, IntegerField
from channels.db import database_sync_to_async

from database.models import ServerConfiguration, Database, Address, User
from lib.decorators import typeCheckFunc
from lib.SQL.SQLController import SQL
from lib.ProductionDataClasses import ActivityOrderDataClass, ClosedDateDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerCustomerMappingDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass
from lib import pdfGeneration

from constants import JSON_ADDRESS, JSON_DATABASE, JSON_SERVER_CONFIG

from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple, Type
import logging

logger = logging.getLogger('DebugLogger')

djangoModels: Dict[str, Type[Model]] = {
  JSON_ADDRESS : Address,
  JSON_DATABASE : Database,
  JSON_SERVER_CONFIG : ServerConfiguration,
}


class DatabaseInterface():
  """_summary_
  """
  def __init__(self, SQL_Controller=SQL()):
    self.SQL = SQL_Controller

  @database_sync_to_async
  def getServerConfiguration(self) -> ServerConfiguration:
    """Get the server configuration

    Returns:
        ServerConfiguration: the server configuration Instance
    """
    return self.SQL.getServerConfig()


  ##### ----- Functions related to freeing Orders ----- #####
  @database_sync_to_async
  def createPDF(
    self,
    Orders: ActivityOrderDataClass,
    Vials: List[VialDataClass],
    CoidOrder = None,
    VialOrders = None,
  ):
    Order = Orders[0]
    customer = self.SQL.getElement(Order.BID, CustomerDataClass)
    Tracer = self.SQL.getElement(Order.tracer, TracerDataClass)
    Isotope = self.SQL.getElement(Tracer.isotope, IsotopeDataClass)
    pdfPath = pdfGeneration.getPdfFilePath(customer, Order)
    pdfGeneration.DrawActivityOrder(pdfPath, customer, Order, Vials, Isotope, Tracer, COID_ORDER=CoidOrder, VialOrders=VialOrders)
    return pdfPath

  @database_sync_to_async
  def createInjectionPDF(
      self,
      InjectionOrder : InjectionOrderDataClass,
    ):
    customer = self.SQL.getElement(InjectionOrder.BID, CustomerDataClass)
    Tracer = self.SQL.getElement(InjectionOrder.tracer, TracerDataClass)
    Isotope = self.SQL.getElement(Tracer.isotope, IsotopeDataClass)

    pdfPath = pdfGeneration.getPdfFilePath(customer, InjectionOrder)
    pdfGeneration.DrawInjectionOrder(pdfPath, customer, InjectionOrder, Isotope, Tracer)

    return pdfPath

  @database_sync_to_async
  def freeDependantOrders(self, order : ActivityOrderDataClass, user : User):
    return self.SQL.freeDependantOrder(order, user)

  ###### ----- Free function End ----- ######

  @database_sync_to_async
  def getGreatState(self) -> Tuple[
      List[EmployeeDataClass],
      List[CustomerDataClass],
      List[DeliverTimeDataClass],
      List[IsotopeDataClass],
      List[VialDataClass],
      List[RunsDataClass],
      List[ActivityOrderDataClass],
      List[InjectionOrderDataClass],
      ServerConfiguration,
      List[Database],
      List[Address],
      List[ClosedDateDataClass]]:

    """This function is responsible for gathering the state of the database.

      Returns:
        Tuple[List[],]
    """
    SC = self.SQL.getServerConfig()
    databases = self.SQL.getModels(Database)
    addresses = self.SQL.getModels(Address)

    dateRange = SC.DateRange # Move this to serverconfiguration


    today = datetime.now()
    startDate = today - timedelta(days=dateRange)
    endDate = today + timedelta(days=dateRange)

    Employees = self.SQL.getEmployees() # Not a legacy db concept
    Customers = self.SQL.getDataClass(CustomerDataClass)
    DeliTimes = self.SQL.getDataClass(DeliverTimeDataClass)
    Isotopes  = self.SQL.getDataClass(IsotopeDataClass)
    Runs      = self.SQL.getDataClass(RunsDataClass)
    Tracers   = self.SQL.getDataClass(TracerDataClass)
    TCustomer = self.SQL.getDataClass(TracerCustomerMappingDataClass)
    Orders    = self.SQL.getDataClassRange(startDate, endDate, ActivityOrderDataClass)
    Vials     = self.SQL.getDataClassRange(startDate, endDate, VialDataClass)
    T_Orders  = self.SQL.getDataClassRange(startDate, endDate, InjectionOrderDataClass)
    closeDate = self.SQL.getDataClassRange(startDate.date(), endDate.date(), ClosedDateDataClass)

    return (Employees, Customers, DeliTimes, Isotopes, Vials, Runs, Orders, T_Orders, Tracers, TCustomer, SC, list(databases), list(addresses), closeDate)

  ###### ----- Generic Methods ----- ######

  @database_sync_to_async
  def createDataClass(self, skeleton : Dict, DataClass) -> JsonSerilizableDataClass:
    return self.SQL.createDataClass(skeleton, DataClass)

  @database_sync_to_async
  def getServerConfig(self):
    return self.SQL.getServerConfig()

  @database_sync_to_async
  def getElement(self, ID: int, Dataclass) -> Optional[JsonSerilizableDataClass]:
    return self.SQL.getElement(ID, Dataclass)

  @database_sync_to_async
  def updateDataClass(self, dataClass : JsonSerilizableDataClass):
    """Updates an exists entry to the new values

    Programer note, is to make this a method dependant on the dataclass similiar to that create

    Args:
        dataClass (JsonSerilizableDataClass): _description_
    """
    self.SQL.UpdateJsonDataClass(dataClass)

  @database_sync_to_async
  def getDataClass(self, dataClass : Type) -> List[JsonSerilizableDataClass]:
    return self.SQL.getDataClass(dataClass)

  @database_sync_to_async
  def getDataClassRange(self, startDate: date, endDate: date, DataClass: Type[JsonSerilizableDataClass]) -> List[JsonSerilizableDataClass]:
    return self.SQL.getDataClassRange(startDate, endDate, DataClass)

  @database_sync_to_async
  @typeCheckFunc
  def DeleteIDs(self, ids : List[int], DataClass : Type[JsonSerilizableDataClass]) -> None:
    self.SQL.deleteIDs(ids, DataClass)

  @database_sync_to_async
  def CanDelete(self, data : JsonSerilizableDataClass) -> bool:
    return True

  @database_sync_to_async
  def GetConditionalElements(self, condition : str, dataClass : Type ) -> List[JsonSerilizableDataClass]:
    return self.SQL.getConditionalElements(condition, dataClass)

  @database_sync_to_async
  def editDjango(self, model_identifier : str, model : Dict, modelID: Any):
    modelType = djangoModels.get(model_identifier)
    if modelType is None:
      raise KeyError("Unknown model")

    instance: Model = modelType.objects.get(pk=modelID)

    for key, value in model.items():
      field = instance._meta.get_field(key)
      if isinstance(field, ForeignKey):
        value = field.remote_field.model.objects.get(pk=value)
      elif isinstance(field, IntegerField):
        value = int(value)
      instance.__setattr__(key, value)

    instance.save()

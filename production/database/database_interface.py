"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional, Tuple, Type
import logging

# Django Packages
from channels.db import database_sync_to_async
from django.db.models import Model, ForeignKey, IntegerField

# Tracershop Production Packages
from constants import JSON_TRACER,JSON_BOOKING,  JSON_TRACER_MAPPING, JSON_VIAL,\
    JSON_PRODUCTION, JSON_ISOTOPE, JSON_INJECTION_ORDER,  JSON_DELIVERTIME, \
    JSON_ADDRESS, JSON_CUSTOMER, JSON_DATABASE, JSON_SERVER_CONFIG,\
    JSON_ACTIVITY_ORDER, JSON_CLOSEDDATE, JSON_LOCATION, JSON_ENDPOINT,\
    JSON_SECONDARY_EMAIL, JSON_PROCEDURE, JSON_USER, JSON_USER_ASSIGNMENT,\
    JSON_MESSAGE, JSON_MESSAGE_ASSIGNMENT
from database.models import ServerConfiguration, Database, Address, User,\
    UserGroups, getModel, TracershopModel
from database.production_database.SQLController import SQL
from lib.decorators import typeCheckFunc
from lib import pdfGeneration
from dataclass.ProductionDataClasses import ActivityOrderDataClass, ClosedDateDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerCustomerMappingDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass


logger = logging.getLogger('DebugLogger')



class DatabaseInterface():
  """This class is the interface for the production database. This includes
  both the Django database and the Production database
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
  def getExternalDatabase(self, serverConfig: ServerConfiguration) -> Database:
    if serverConfig.ExternalDatabase is not None:
      return serverConfig.ExternalDatabase
    raise Exception


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
  def DeleteInstance(self, dataClass: JsonSerilizableDataClass) -> None:
    id_field = dataClass.getIDField()
    ID = getattr(dataClass,id_field)

    self.SQL.deleteIDs([ID], dataClass.__class__)

  @database_sync_to_async
  def CanDelete(self, data : JsonSerilizableDataClass) -> bool:
    return True

  @database_sync_to_async
  def GetConditionalElements(self, condition : str, dataClass : Type ) -> List[JsonSerilizableDataClass]:
    return self.SQL.getConditionalElements(condition, dataClass)

  @database_sync_to_async
  def editModel(self, model_identifier: str, model : Dict, modelID: Any):
    instance: Model = getModel(model_identifier).objects.get(pk=modelID)
    instance.assignDict(model)
    instance.save()

  @database_sync_to_async
  def getModel(self, model: Type[Model], identifier: Any, key = None):
    if key is None:
      return model.objects.get(pk=identifier)
    else:
      return model.objects.get(key=identifier)

  @database_sync_to_async
  def deleteModel(self, modelIdentifier: str, modelID: Any, user: User) -> bool:
    """Deletes a model instance """

    model = getModel(modelIdentifier).objects.get(pk=modelID)
    canDelete = model.canDelete(modelID, user)
    if canDelete:
      model.delete()
    return canDelete

  @database_sync_to_async
  def createModel(self, modelIdentifier: str, modelDict: Dict):
    instance = getModel(modelIdentifier)()
    instance.assignDict(modelDict)
    instance.save()

    return instance

  @database_sync_to_async
  def saveModel(self, model: TracershopModel) -> None:
    model.save()
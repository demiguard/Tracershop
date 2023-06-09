"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Iterable, Optional, Tuple, Type
import logging

# Django Packages
from channels.db import database_sync_to_async
from django.db.models import Model, ForeignKey, IntegerField
from django.core.serializers import serialize

# Tracershop Production Packages
from core.side_effect_injection import DateTimeNow
from constants import JSON_TRACER,JSON_BOOKING,  JSON_TRACER_MAPPING, JSON_VIAL,\
    JSON_PRODUCTION, JSON_ISOTOPE, JSON_INJECTION_ORDER,  JSON_DELIVERTIME, \
    JSON_ADDRESS, JSON_CUSTOMER, JSON_DATABASE, JSON_SERVER_CONFIG,\
    JSON_ACTIVITY_ORDER, JSON_CLOSEDDATE, JSON_LOCATION, JSON_ENDPOINT,\
    JSON_SECONDARY_EMAIL, JSON_PROCEDURE, JSON_USER, JSON_USER_ASSIGNMENT,\
    JSON_MESSAGE, JSON_MESSAGE_ASSIGNMENT
from database.models import ServerConfiguration, Database, Address, User,\
    UserGroups, getModel, TracershopModel, ActivityOrder, OrderStatus,\
    InjectionOrder, Vial, ClosedDate
from database.production_database.SQLController import SQL
from lib.decorators import typeCheckFunc
from lib import pdfGeneration
from dataclass.ProductionDataClasses import ActivityOrderDataClass, ClosedDateDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerCustomerMappingDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass


logger = logging.getLogger('DebugLogger')



class DatabaseInterface():
  """This class is the interface for the production database. This includes
  both the Django database and the Production database
  """
  def __init__(self, SQL_Controller=SQL(), datetimeNow = DateTimeNow()):
    self.SQL = SQL_Controller
    self.datetimeNow = datetimeNow

  @database_sync_to_async
  def getServerConfiguration(self) -> ServerConfiguration:
    """Get the server configuration

    Here because it needs an async counterpart

    Returns:
        ServerConfiguration: the server configuration Instance
    """
    return ServerConfiguration.get()


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
  def editModel(self, model_identifier: str, model : Dict, modelID: Any):
    instance: Model = getModel(model_identifier).objects.get(pk=modelID)
    instance.assignDict(model)
    instance.save()

  @database_sync_to_async
  def getModel(self, model: Type[Model], identifier: Any, key = None) -> TracershopModel:
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

  @database_sync_to_async
  def saveModels(self,model: Type[TracershopModel], models: List[TracershopModel], tags: List[str]):
    model.objects.bulk_update(models, fields=tags)

  @database_sync_to_async
  def releaseOrders(self, deliverTime: ActivityOrderDataClass, release_date: date, user: User):
    """Releases an order"""
    now = self.datetimeNow.now()

    order = ActivityOrder.objects.filter(ordered_time_slot=deliverTime,
                                         delivery_date=release_date)

    order.update(status=OrderStatus.Released, freed_datetime=now, freed_by=user)

    moved_orders = ActivityOrder.objects.filter(moved_to_time_slot=deliverTime,
                                                delivery_date=order.delivery_date)

    moved_orders.update(
      status=OrderStatus.Released, freed_datetime=now, freed_by=user
    )

    return order + moved_orders

  @database_sync_to_async
  def getTimeSensitiveData(self, centralDate: datetime, user: User):
    serverConfig = ServerConfiguration.get()

    startDate = centralDate - timedelta(days=serverConfig.DateRange)
    endDate = centralDate + timedelta(days=serverConfig.DateRange)

    return {
      JSON_ACTIVITY_ORDER : ActivityOrder.objects.filter(
        delivery_date__range=[startDate, endDate]
      ),
      JSON_INJECTION_ORDER : InjectionOrder.objects.filter(
        delivery_date__range=[startDate, endDate]
      ),
      JSON_VIAL : Vial.objects.filter(
        fill_date__range=[startDate, endDate]
      ),
      JSON_CLOSEDDATE : ClosedDate.objects.filter(
        close_date__range=[startDate, endDate]
      )
    }

  @database_sync_to_async
  def serialize_dict(self, instances: Dict[str, Iterable[TracershopModel]]):
    return {
      key : serialize('json', models) for key, models in instances.items()
    }

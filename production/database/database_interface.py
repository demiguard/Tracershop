"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import datetime, date, timedelta
from typing import Any, Callable, Dict, List, Iterable, Optional, Tuple, Type
import logging

# Django Packages
from channels.db import database_sync_to_async
from django.db.models import Model, ForeignKey, IntegerField
from django.db.models.query import QuerySet
from django.core.serializers import serialize
from django.apps import apps


# Tracershop Production Packages
from core.side_effect_injection import DateTimeNow
from constants import JSON_TRACER,JSON_BOOKING,  JSON_TRACER_MAPPING, JSON_VIAL,\
    JSON_PRODUCTION, JSON_ISOTOPE, JSON_INJECTION_ORDER,  JSON_DELIVER_TIME, \
    JSON_ADDRESS, JSON_CUSTOMER, JSON_DATABASE, JSON_SERVER_CONFIG,\
    JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_LOCATION, JSON_ENDPOINT,\
    JSON_SECONDARY_EMAIL, JSON_PROCEDURE, JSON_USER, JSON_USER_ASSIGNMENT,\
    JSON_MESSAGE, JSON_MESSAGE_ASSIGNMENT
from database.models import ServerConfiguration, Database, Address, User,\
    UserGroups, getModel, TracershopModel, ActivityOrder, OrderStatus,\
    InjectionOrder, Vial, ClosedDate, MODELS, INVERTED_MODELS, TIME_SENSITIVE_FIELDS

from lib.decorators import typeCheckFunc
from lib import pdfGeneration
from dataclass.ProductionDataClasses import ActivityOrderDataClass, ClosedDateDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerCustomerMappingDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass


logger = logging.getLogger('DebugLogger')



class DatabaseInterface():
  """This class is the interface for the production database. This includes
  both the Django database and the Production database
  """
  def __init__(self, datetimeNow = DateTimeNow()):
    self.datetimeNow = datetimeNow


  @property
  def serverConfig(self) -> ServerConfiguration:
    if not hasattr(self, '_serverConfig'):
      self._serverConfig = ServerConfiguration.get()
    return self._serverConfig

  @property
  def __modelGetters(self):
    return {
      JSON_ACTIVITY_ORDER : self.__timeUserSensitiveFilter(JSON_ACTIVITY_ORDER),
      JSON_CLOSED_DATE : self.__timeUserSensitiveFilter(JSON_CLOSED_DATE),
      JSON_INJECTION_ORDER : self.__timeUserSensitiveFilter(JSON_INJECTION_ORDER),
      JSON_VIAL : self.__timeUserSensitiveFilter(JSON_VIAL),
    }


  @database_sync_to_async
  def getServerConfiguration(self) -> ServerConfiguration:
    """Get the server configuration

    Here because it needs an async counterpart

    Returns:
        ServerConfiguration: the server configuration Instance
    """
    return ServerConfiguration.get()


  ##### ----- Functions related to freeing Orders ----- #####
  """_summary_

    Returns:
        _type_: _description_
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
  """

  @database_sync_to_async
  def editModel(self, model_identifier: str, model : Dict, modelID: Any):
    instance: Model = getModel(model_identifier).objects.get(pk=modelID)
    instance.assignDict(model)
    instance.save()

  @database_sync_to_async
  def getModel(self, model: Type[TracershopModel], identifier: Any, key = None) -> TracershopModel:
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

    order = ActivityOrder.objects.get(ordered_time_slot=deliverTime,
                                         delivery_date=release_date)
    order.status=OrderStatus.Released
    order.freed_datetime=now
    order.freed_by=user
    order.save()

    moved_orders = ActivityOrder.objects.filter(moved_to_time_slot=deliverTime,
                                                delivery_date=order.delivery_date)
    moved_orders.update(
      status=OrderStatus.Released, freed_datetime=now, freed_by=user
    )

    return [order] + list(moved_orders)


  def __timeUserSensitiveFilter(self, model_identifier: str):
    model = MODELS[model_identifier]
    timeField = TIME_SENSITIVE_FIELDS[model_identifier]

    def filterFunction(centralDate: datetime, user: User):
      query = model.objects.all()
      query = self.__timeSensitiveFilter(query, centralDate, timeField)
      query = self.__userFilter(query, user)
      return query


    return filterFunction



  def __timeSensitiveFilter(self,
                          query: QuerySet[TracershopModel],
                          centralDate: datetime,
                          timefield: str):

    startDate = centralDate - timedelta(days=self.serverConfig.DateRange)
    endDate = centralDate + timedelta(days=self.serverConfig.DateRange)

    filter = { f"{timefield}__range" : [startDate, endDate] }

    return query.filter(**filter)

  def __userFilter(self, query: QuerySet[TracershopModel], user: User):
    return query

  @database_sync_to_async
  def getTimeSensitiveData(self, centralDate: datetime, user: User):
    return {
      keyword : self.__modelGetters[keyword](centralDate, user)
        for keyword in TIME_SENSITIVE_FIELDS.keys()
    }

  @database_sync_to_async
  def serialize_dict(self, instances: Dict[str, Iterable[TracershopModel]]):
    return {
      key : serialize('json', models) for key, models in instances.items()
    }

  def getModels(self, user: User) -> List[Type[TracershopModel]]:
    if user.UserGroup == UserGroups.Admin:
      return [model
              for model in apps.get_app_config('database').get_models()
                # This line is here to ensure models are the correct type
                # As django might add some models for itself
                if issubclass(model, TracershopModel)]
    return []

  @database_sync_to_async
  def getState(self, referenceTime: datetime, user: User) -> Dict[str, List[TracershopModel]]:
    models = self.getModels(user)
    instances = {}
    for model in models:
      modelKeyword = INVERTED_MODELS.get(model)
      if modelKeyword is None:
        logger.warning(f"ModelKeyword {model.__name__} is missing in database.models.INVERTED_MODELS")
        continue
      if modelKeyword in self.__modelGetters:
        instances[modelKeyword] = self.__modelGetters[modelKeyword](referenceTime, user)
      else:
        instances[modelKeyword] = model.objects.all()
    return instances


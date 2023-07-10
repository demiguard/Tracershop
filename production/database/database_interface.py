"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import datetime, date, timedelta
from typing import Any, Callable, Dict, List, Iterable, Optional, Tuple, Type, Union
import logging
from functools import reduce

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
    UserGroups, getModelType, TracershopModel, ActivityOrder, OrderStatus,\
    InjectionOrder, Vial, ClosedDate, MODELS, INVERTED_MODELS,\
    TIME_SENSITIVE_FIELDS, ActivityDeliveryTimeSlot, T
from lib.ProductionJSON import ProductionJSONEncoder


logger = logging.getLogger('DebugLogger')



class DatabaseInterface():
  """This class is the interface for the production database. This includes
  both the Django database and the Production database
  """
  def __init__(self, json_encoder:ProductionJSONEncoder = ProductionJSONEncoder()):
    self.json_encoder = json_encoder


  @property
  def serverConfig(self) -> ServerConfiguration:
    if not hasattr(self, '_serverConfig'):
      self._serverConfig = ServerConfiguration.get()
    return self._serverConfig

  @property
  def __modelGetters(self) -> Dict[str, Callable]:
    return {
      JSON_ACTIVITY_ORDER : self.__timeUserSensitiveFilter(JSON_ACTIVITY_ORDER),
      JSON_CLOSED_DATE : self.__timeUserSensitiveFilter(JSON_CLOSED_DATE),
      JSON_INJECTION_ORDER : self.__timeUserSensitiveFilter(JSON_INJECTION_ORDER),
      JSON_VIAL : self.__timeUserSensitiveFilter(JSON_VIAL),
    }

  @property
  def __modelSerializer(self) -> Dict[str, Callable[[str, Dict[str, Any]], TracershopModel]]:
    return {

    }

  @property
  def __modelCanChangeFunctions(self) -> Dict[Type[TracershopModel], Callable[[TracershopModel], bool]]:
    return {

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

  def __defaultModelDeserializer(self, model_identifier: str, jsonModel: Dict[str, Any]) -> TracershopModel:
    modelType = MODELS[model_identifier]
    model = modelType.objects.get(pk=jsonModel['id'])
    del jsonModel['id']
    return model


  @database_sync_to_async
  def handleEditModels(self, model_identifier: str, models : Union[Dict, Iterable[Dict]]) -> Optional[List[TracershopModel]]:
    """Edits model(s) and save them

    If a model fails to be edited,

    Args:
        model_identifier (str): _description_
        models (Union[Dict, Iterable[Dict]]): _description_

    Returns:
        Optional[List[TracershopModel]]: _description_
    """
    if isinstance(models, Dict):
      updateModels = [self.__editModel(model_identifier, models)]
    else:
      updateModels = [self.__editModel(model_identifier, model) for model in models]
    if None in updateModels:
      return None

    [model.save() for model in updateModels if model is not None] # if statement is just their to make the type checker happy
    return updateModels # type: ignore # type checker is stupid

  def __editModel(self, model_identifier: str, jsonModel : Dict) -> Optional[TracershopModel]:
    if model_identifier in self.__modelSerializer:
      model = self.__modelSerializer[model_identifier](model_identifier, jsonModel)
    else:
      model = self.__defaultModelDeserializer(model_identifier, jsonModel)
    if not model._canEdit():
      return None
    try:
      model.assignDict(jsonModel)
    except Exception as e:
      logger.error(e, exc_info=True)
      logger.error(f"Could not assign {jsonModel} to {model}")
      return None

    return model


  @database_sync_to_async
  def getModel(self, model: Type[T], identifier: Any, key: Optional[str]=None) -> T:
    if key is None:
      return model.objects.get(pk=identifier)
    else:
      return model.objects.get(key=identifier)

  @database_sync_to_async
  def deleteModels(self, modelIdentifier: str, modelID: Any, user: User) -> bool:
    """Deletes one or more model instance """
    modelType = getModelType(modelIdentifier)
    if isinstance(modelID, Iterable):
      models = modelType.objects.filter(pk__in = [id_ for id_ in modelID])
      canDelete = reduce(lambda x, y : x and y, [model._canEdit(user) for model in models], True)
      if canDelete:
        [model.delete() for model in models]
    else:
      model = modelType.objects.get(pk=modelID)
      canDelete = model._canEdit(user)
      if canDelete:
        model.delete()
    return canDelete


  def __createModel(self, modelIdentifier: str, modelDict: Dict) -> TracershopModel:
    instance = getModelType(modelIdentifier)()
    instance.assignDict(modelDict)
    instance.save() # Sets primary key as side effect

    return instance

  @database_sync_to_async
  def handleCreateModels(self, modelIdentifier: str, modelDicts: Union[Dict, List[Dict]]) -> QuerySet[TracershopModel]:
    if isinstance(modelDicts, List):
      models = [self.__createModel(modelIdentifier, modelDict) for modelDict in modelDicts]
    else:
      models = [self.__createModel(modelIdentifier, modelDicts)]

    modelType = MODELS[modelIdentifier]
    return modelType.objects.filter(pk__in=[model.pk for model in models])


  @database_sync_to_async
  def saveModel(self, model: TracershopModel) -> None:
    model.save()

  @database_sync_to_async
  def saveModels(self,model: Type[TracershopModel], models: List[TracershopModel], tags: List[str]):
    model.objects.bulk_update(models, fields=tags)

  @database_sync_to_async
  def releaseOrders(self,
                    timeSlotID: int,
                    orderIDs: List[int],
                    vialIDs: List[int],
                    user: User,
                    now: datetime) -> Tuple[QuerySet[ActivityOrder],QuerySet[Vial]]:
    """_summary_

    Args:
        deliverTime (ActivityDeliveryTimeSlot): _description_
        orders (_type_): _description_
        vials (_type_): _description_
        user (User): _description_
        now (datetime): _description_

    Returns:
        Tuple[QuerySet[ActivityOrder],QuerySet[Vial]]: _description_
    """
    ##### User check, can free
    if user.UserGroup not in [UserGroups.Admin, UserGroups.ProductionAdmin, UserGroups.ProductionUser]:
      raise Exception

    timeSlot = ActivityDeliveryTimeSlot.objects.get(pk=timeSlotID)
    orders = ActivityOrder.objects.filter(pk__in=orderIDs)
    vials = Vial.objects.filter(pk__in=vialIDs)

    if len(vials) == 0:
      raise Exception
    if len(orders) == 0:
      raise Exception
    pivot_order = orders[0]

    for order in orders:
      if not order.status == OrderStatus.Accepted:
        print(f"Order Status missmatch! {order.status}", order.status == OrderStatus.Accepted)
        raise Exception
      if not (order.moved_to_time_slot == timeSlot or order.ordered_time_slot == timeSlot):
        raise Exception

      order.status = OrderStatus.Released
      order.freed_by = user
      order.freed_datetime = now

    for vial in vials:
      if vial.assigned_to is not None:
        raise Exception

      vial.assigned_to = pivot_order
    # Commit!
    Vial.objects.bulk_update(vials, ['assigned_to'])
    ActivityOrder.objects.bulk_update(orders, ['status', 'freed_by', 'freed_datetime'])

    return orders, vials



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
  def serialize_dict(self, instances: Dict[str, Iterable[TracershopModel]]) -> str:
    """Transforms some models to a string representation of those models.
    It removes any fields that should not be broadcast such a passwords

    Args:
        instances (Dict[str, Iterable[TracershopModel]]): _description_

    Returns:
        _type_: _description_
    """
    serialized_dict = {}

    for key, models in instances.items():
      Model = MODELS[key]
      if not isinstance(models, QuerySet):
        primary_keys = [model.pk for model in models]
        models = Model.objects.filter(pk__in=primary_keys)

      serialized_models = serialize('python', models)
      for serialized_model in serialized_models:
        fields = serialized_model['fields']
        for keyword in Model.exclude: #type: ignore
          del fields[keyword]
      serialized_dict[key] = serialized_models

    return self.json_encoder.encode(serialized_dict)

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

  def __canChange(self, model: TracershopModel) -> bool:
    if type(model) in self.__modelCanChangeFunctions:
      return self.__modelCanChangeFunctions[type(model)](model)
    return True


  @database_sync_to_async
  def moveOrders(self, orderIDs: List[int], destinationID: int):
    orders = ActivityOrder.objects.filter(pk__in=orderIDs)
    destination = ActivityDeliveryTimeSlot.objects.get(pk=destinationID)

    for order in orders:
      if order.ordered_time_slot != destination:
        order.moved_to_time_slot = destination
      else:
        order.moved_to_time_slot = None

    ActivityOrder.objects.bulk_update(orders, ['moved_to_time_slot'])

    return orders

  @database_sync_to_async
  def restoreDestinations(self, orderIDs: List[int]):
    orders = ActivityOrder.objects.filter(pk__in=orderIDs)
    for order in orders:
      order.moved_to_time_slot = None
    ActivityOrder.objects.bulk_update(orders, ['moved_to_time_slot'])
    return orders
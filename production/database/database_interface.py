"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import datetime, date, timedelta
from typing import Any, Callable, Dict, List, Iterable, Optional, Tuple, Type, Union, MutableSet
import logging
from functools import reduce
from math import floor

# Django Packages
from channels.db import database_sync_to_async
from django.apps import apps
from django.conf import settings
from django.core.serializers import serialize
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db.models import Model, ForeignKey, IntegerField
from django.db.models.query import QuerySet


# Tracershop Production Packages
from constants import ERROR_LOGGER, DEBUG_LOGGER
from core.side_effect_injection import DateTimeNow
from core.exceptions import IllegalActionAttempted
from shared_constants import DATA_VIAL, DATA_INJECTION_ORDER, DATA_CUSTOMER,\
    DATA_ACTIVITY_ORDER, DATA_CLOSED_DATE, AUTH_USERNAME, AUTH_PASSWORD
from database.models import ServerConfiguration, User,\
    UserGroups, getModelType, TracershopModel, ActivityOrder, OrderStatus,\
    InjectionOrder, Vial, MODELS, INVERTED_MODELS,\
    TIME_SENSITIVE_FIELDS, ActivityDeliveryTimeSlot, T,\
    DeliveryEndpoint, UserAssignment, Booking, TracerTypes, BookingStatus,\
    TracerUsage, ActivityProduction, Customer, Procedure, Days
from lib.ProductionJSON import ProductionJSONEncoder
from lib.calenderHelper import combine_date_time, subtract_times
from lib.physics import tracerDecayFactor
from lib.ldap import ldap_search

logger = logging.getLogger(DEBUG_LOGGER)
error_logger = logging.getLogger(ERROR_LOGGER)



class DatabaseInterface():
  """This class is the interface for the production database. This includes
  both the Django database and the Production database
  """
  def __init__(self, DATA_encoder:ProductionJSONEncoder = ProductionJSONEncoder()):
    self.DATA_encoder = DATA_encoder


  @property
  def serverConfig(self) -> ServerConfiguration:
    if not hasattr(self, '_serverConfig'):
      self._serverConfig = ServerConfiguration.get()
    return self._serverConfig

  @property
  def __modelGetters(self) -> Dict[str, Callable]:
    return {
      DATA_ACTIVITY_ORDER : self.__timeUserSensitiveFilter(DATA_ACTIVITY_ORDER),
      DATA_CLOSED_DATE : self.__timeUserSensitiveFilter(DATA_CLOSED_DATE),
      DATA_INJECTION_ORDER : self.__timeUserSensitiveFilter(DATA_INJECTION_ORDER),
      DATA_VIAL : self.__timeUserSensitiveFilter(DATA_VIAL),
    }

  @property
  def __modelSerializer(self) -> Dict[str, Callable[[str, Dict[str, Any]], TracershopModel]]:
    return {

    }

  @property
  def __modelCanChangeFunctions(self) -> Dict[Type[TracershopModel], Callable[[TracershopModel], bool]]:
    return {

    }

  def __defaultModelDeserializer(self, model_identifier: str, jsonModel: Dict[str, Any]) -> TracershopModel:
    modelType = MODELS[model_identifier]
    model = modelType.objects.get(pk=jsonModel['id'])
    del jsonModel['id']
    return model


  @database_sync_to_async
  def handleEditModels(self,
                       model_identifier: str,
                       models : Union[Dict, Iterable[Dict]],
                       user: User) -> Optional[List[TracershopModel]]:
    """Edits model(s) and save them

    If a model fails to be edited,

    Args:
        model_identifier (str): _description_
        models (Union[Dict, Iterable[Dict]]): _description_

    Returns:
        Optional[List[TracershopModel]]: _description_
    """
    if isinstance(models, Dict):
      updateModels = [self.__editModel(model_identifier, models, user)]
    else:
      updateModels = [self.__editModel(model_identifier, model, user) for model in models]
    if None in updateModels:
      return None

    [model.save(user) for model in updateModels if model is not None] # if statement is just their to make the type checker happy
    return updateModels # type: ignore # type checker is stupid

  def __editModel(self, model_identifier: str, jsonModel : Dict, user: User) -> Optional[TracershopModel]:
    if model_identifier in self.__modelSerializer:
      model = self.__modelSerializer[model_identifier](model_identifier, jsonModel)
    else:
      model = self.__defaultModelDeserializer(model_identifier, jsonModel)
    if not model.canEdit(user):
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
    """Deletes one or more model instance, if one or more models cannot be
    deleted, then no models are deleted and this function returns false
    returns true if successfully deleted all models

    """

    # So a performance hic up here is that canDelete must be called on all
    # objects with this notation, secondly delete also calls canDelete again
    # This means this operation "Might" have 3 database quires per object
    # 2 from canDelete, and 1 form the actually deletion

    modelType = getModelType(modelIdentifier)
    if isinstance(modelID, Iterable):
      models = modelType.objects.filter(pk__in = [id_ for id_ in modelID])
      canDelete = reduce(lambda x, y : x and y, [model.canDelete(user) for model in models], True)
      if canDelete:
        [model.delete() for model in models]
    else:
      model = modelType.objects.get(pk=modelID)
      canDelete = model.canEdit(user)

      if canDelete:
        model.delete()
    return bool(canDelete)


  def __createModel(self, model: Type[T], modelDict: Dict, user: User) -> T:
    instance = model()
    instance.assignDict(modelDict)
    instance.save(user) # Sets primary key as side effect && and logs if needed

    return instance

  @database_sync_to_async
  def handleCreateModels(self, modelIdentifier: str, modelDicts: Union[Dict, List[Dict]], user: User) -> QuerySet[TracershopModel]:
    modelType = getModelType(modelIdentifier)
    if isinstance(modelDicts, List):
      models = [self.__createModel(modelType, modelDict, user) for modelDict in modelDicts]
    else:
      models = [self.__createModel(modelType, modelDicts, user)]

    modelType = MODELS[modelIdentifier]
    return modelType.objects.filter(pk__in=[model.pk for model in models])


  @database_sync_to_async
  def saveModel(self, model: TracershopModel, user) -> None:
    model.save(user)

  @database_sync_to_async
  def saveModels(self,
                 model: Type[TracershopModel],
                 models: List[TracershopModel],
                 tags: List[str]):
    model.objects.bulk_update(models, fields=tags)

  @database_sync_to_async
  def releaseOrders(self,
                    timeSlotID: int,
                    orderIDs: List[int],
                    vialIDs: List[int],
                    user: User,
                    now: datetime) -> Tuple[QuerySet[ActivityOrder],QuerySet[Vial]]:
    """Releases

    Args:
        deliverTime (ActivityDeliveryTimeSlot): _description_
        orderIDs (List[int]): _description_
        vialIDs (List[int]): _description_
        user (User): _description_
        now (datetime): _description_

    Returns:
        Tuple[QuerySet[ActivityOrder],QuerySet[Vial]]: _description_
    """
    ##### User check, can free
    if user.user_group not in [UserGroups.Admin, UserGroups.ProductionAdmin, UserGroups.ProductionUser]:
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

    return self.DATA_encoder.encode(serialized_dict)

  def getModels(self, user: User) -> List[Type[TracershopModel]]:
    return [model for model in apps.get_app_config('database').get_models()
                # This line is here to ensure models are the correct type
                # As django might add some models for itself
                if issubclass(model, TracershopModel)]

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

  @database_sync_to_async
  def getRelatedCustomerIDs(self, user: User) -> List[int]:
    userAssignments = UserAssignment.objects.filter(user=user)

    return [userAssignment.customer.id
              for userAssignment in userAssignments]

  @database_sync_to_async
  def getCustomerIDs(self, models: Iterable[T]) -> Optional[List[int]]:
    customerIDs = set()
    endpointIDs = set()
    timeSlotsIDs = set()

    # Helper Handler Functions, each of them should handle an instance type
    # And add to the customerIDs, which is then converted to the related
    # Customer IDs

    def __UserAssignmentHandler(instance: UserAssignment):
      customerIDs.add(instance.customer.id)

    def __EndpointHandler(instance: DeliveryEndpoint,):
      owner = instance.owner # Database Access
      customerIDs.add(owner.id)

    def __ActivityOrder(instance: ActivityOrder):
      timeSlot = instance.ordered_time_slot # Database Access
      timeSlotID = timeSlot.id
      if timeSlotID in timeSlotsIDs:
        return
      else:
        timeSlotsIDs.add(timeSlotID)

      endpoint = timeSlot.destination # Database Access
      endpointID = endpoint.id
      if endpointID in endpointIDs:
        return
      else:
        endpointIDs.add(endpointID)

      owner = endpoint.owner # Database Access
      customerIDs.add(owner.id)

    def __InjectionOrderHandler(instance: InjectionOrder):
      endpoint = instance.endpoint # Database Access
      endpointID = endpoint.id
      if endpointID in endpointIDs:
        return
      else:
        endpointIDs.add(endpointID)

      owner = endpoint.owner # Database Access
      customerIDs.add(owner.id)

    def __ActivityDeliveryTimeSlotHandler(instance: ActivityDeliveryTimeSlot):
      endpoint = instance.destination # Database Access
      endpointID = endpoint.id
      if endpointID in endpointIDs:
        return
      else:
        endpointIDs.add(endpointID)
      owner = endpoint.owner # Database Access
      customerIDs.add(owner.id)

    modelHandlers: Dict[Type[TracershopModel], Callable] = { # No clue how to type hint Callable :(
      ActivityDeliveryTimeSlot : __ActivityDeliveryTimeSlotHandler,
      ActivityOrder : __ActivityOrder,
      UserAssignment : __UserAssignmentHandler,
      DeliveryEndpoint : __EndpointHandler,
      InjectionOrder : __InjectionOrderHandler,
    }

    for instance in models:
      handler = modelHandlers.get(instance.__class__, None)
      if handler is None:
        return None
      else:
        handler(instance)

    return [customerID for customerID in customerIDs]

  @database_sync_to_async
  def createUserAssignment(self, username, customer_id, user):
    try:
      customer = Customer.objects.get(pk=customer_id)
    except ObjectDoesNotExist:
      return  None

    try:
      user = User.objects.get(username=username)
    except ObjectDoesNotExist:
      ldap_result = ldap_search(username)


      user = User()

    user_assignment = UserAssignment(user=user, customer=customer)
    user_assignment.save(user)

    return user_assignment


  @database_sync_to_async
  def massOrder(self, bookings: Dict[str, bool], user: User):
    timeSlotsBookings: Dict[ActivityDeliveryTimeSlot, float] = {}
    injectionBookings: List[InjectionOrder] = []
    activityBookings: List[ActivityOrder] = []
    bookingUpdated: List[Booking] = []

    bookingDate = date(1970, 1 ,1)

    for accessionNumber, ordering in bookings.items():
      try:
        booking = Booking.objects.get(accession_number=accessionNumber)
      except ObjectDoesNotExist:
        logger.error(f"Booking for accession Number {accessionNumber} have no matching backend copy")
        continue

      bookingDate = booking.start_date
      endpoint = booking.location.endpoint
      procedureIdentifier = booking.procedure

      if endpoint is None:
        error_logger.error(f"Booking {booking} is being ordered, but its location: {booking.location} has no associated endpoint!")

      try:
        procedure = Procedure.objects.get(series_description=procedureIdentifier,
                                          owner=endpoint)
      except ObjectDoesNotExist:
        error_logger.error(f"Could not find a matching procedure for DeliveryEndpoint: {endpoint} and series description: {procedureIdentifier}")
        continue
      except MultipleObjectsReturned:
        # There's a unique_together that prevents this line from being relevant
        error_logger.critical(f"Database corruption! Multiple Procedures are associated with DeliveryEndpoint: {endpoint} and series description: {procedureIdentifier}")
        continue

      tracer = procedure.tracer

      if tracer is None:
        error_logger.error(f"Booking for Accession number {accessionNumber} is missing either tracer: {tracer}")
        continue

      if not ordering:
        booking.status = BookingStatus.Rejected
        bookingUpdated.append(booking)

      # Muh Turnery Operation, mate that would NOT fit in a turnery
      if tracer.tracer_type == TracerTypes.InjectionBased:
        injectionBookings.append(InjectionOrder(
          delivery_time=booking.start_time,
          delivery_date=booking.start_date,
          injections=procedure.tracer_units,
          status=1,
          tracer_usage=TracerUsage.human,
          comment="",
          ordered_by=user,
          endpoint=endpoint,
          tracer=tracer
        ))

        booking.status = BookingStatus.Ordered
      else:
        day=booking.start_date.weekday()
        productions=ActivityProduction.objects.filter(
          production_day=day,
        )
        booking_time = combine_date_time(booking.start_date, booking.start_time)\
          + timedelta(minutes=procedure.delay_minutes)
        timeSlots = ActivityDeliveryTimeSlot.objects.filter(
          destination=endpoint,
          production_run__in=productions,
          delivery_time__lte=booking_time.time()
        ).order_by('delivery_time').reverse()

        if len(timeSlots) == 0:
          error_logger.error(f"Booking: {booking} is being ordered to {endpoint} at {booking.start_date}, but that endpoint doesn't have any ActivityDeliveryTimeSlots to {Days(day)}")
          continue
        timeSlot = timeSlots[0]
        timeDelta = subtract_times(booking_time.time(), timeSlot.delivery_time)

        activity = procedure.tracer_units / tracerDecayFactor(tracer, timeDelta.seconds)

        if timeSlot not in timeSlotsBookings:
          timeSlotsBookings[timeSlot] = 0
        timeSlotsBookings[timeSlot] += activity

        booking.status = BookingStatus.Ordered

      bookingUpdated.append(booking)
    # End of booking iteration

    for timeSlot, activity in timeSlotsBookings.items():
      activityBookings.append(
        ActivityOrder(
          ordered_activity=floor(activity),
          delivery_date=bookingDate,
          status=OrderStatus.Accepted,
          comment="",
          ordered_time_slot=timeSlot,
          ordered_by=user
        )
      )

    activityOrders = ActivityOrder.objects.bulk_create(activityBookings)
    injectionsOrders = InjectionOrder.objects.bulk_create(injectionBookings)

    Booking.objects.bulk_update(bookingUpdated, ['status'])

    return {
      DATA_ACTIVITY_ORDER : activityOrders,
      DATA_INJECTION_ORDER : injectionsOrders
    }

  @database_sync_to_async
  def createExternalUser(self, userSkeleton: Dict[str, Any]):
    """Create an external user

    Args:
        userSkeleton (Dict[str, Any]): Message containing:
          * AUTH_USERNAME - string - the username of the new user
          * AUTH_PASSWORD - string - the password of the new user
          * DATA_CUSTOMER - Optional int - if defined, the customer the user
                                           represents.
    """
    newExternalUser = User(username=userSkeleton[AUTH_USERNAME],
                           user_group=UserGroups.ShopExternal)

    newExternalUser.set_password(userSkeleton[AUTH_PASSWORD])
    newExternalUser.save()

    if DATA_CUSTOMER in userSkeleton:
      customer = Customer.objects.get(pk=userSkeleton[DATA_CUSTOMER])

      newUserAssignment = UserAssignment(user=newExternalUser, customer=customer)
      newUserAssignment.save()
    else:
      newUserAssignment = None

    return newExternalUser, newUserAssignment

  @database_sync_to_async # This is just to get a sync environment.
  def changeExternalPassword(externalUserID, externalNewPassword):
    """changes the password of a user

    Args:
        externalUserID (int): The 
        externalNewPassword (string): _description_

    Raises:
        IllegalActionAttempted: _description_
    """
    externalUser = User.objects.get(pk=externalUserID)
    if externalUser.user_group != UserGroups.ShopExternal:
      raise IllegalActionAttempted
    externalUser.set_password(externalNewPassword)
    externalUser.save()



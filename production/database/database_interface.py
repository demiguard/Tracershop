"""This module contains the database Interface class, which is a representation
of the underlying database. This should provide a single face to the rather
complicated database setup of tracershop.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from calendar import monthrange
from datetime import datetime, date, timedelta, time
from typing import Any, Callable, Dict, List, Iterable, Optional, Tuple, Type, Union, MutableSet, TypedDict
import logging
from functools import reduce
from math import floor
from zoneinfo import ZoneInfo

# Django Packages
from channels.db import database_sync_to_async
from django.apps import apps
from django.conf import settings
from django.core.serializers import serialize
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.db import connection
from django.db.models.manager import BaseManager
from django.db.models import Sum
from django.db.models.query import QuerySet
from django.db.utils import IntegrityError


# Tracershop Production Packages
from constants import AUDIT_LOGGER, ERROR_LOGGER, DEBUG_LOGGER
from core.side_effect_injection import DateTimeNow
from core.exceptions import IllegalActionAttempted,\
  RequestingNonExistingEndpoint, UndefinedReference, ContractBroken
from shared_constants import DATA_VIAL, DATA_INJECTION_ORDER, DATA_CUSTOMER,\
    DATA_ACTIVITY_ORDER, DATA_CLOSED_DATE, AUTH_USERNAME, AUTH_PASSWORD,\
    EXCLUDED_STATE_MODELS, DATA_TELEMETRY_RECORD, DATA_TELEMETRY_REQUEST,\
    DATA_BOOKING, SUCCESS_STATUS_CRUD, DATA_ISOTOPE_ORDER, DATA_ISOTOPE_VIAL
from database.models import ServerConfiguration, User,\
    UserGroups, getModelType, TracershopModel, ActivityOrder, OrderStatus,\
    InjectionOrder, Vial, MODELS, INVERTED_MODELS,\
    TIME_SENSITIVE_FIELDS, ActivityDeliveryTimeSlot, T,\
    DeliveryEndpoint, UserAssignment, Booking, TracerTypes, BookingStatus,\
    TracerUsage, ActivityProduction, Customer, Procedure, Days,\
    Location, TelemetryRecord, TelemetryRequest, IsotopeOrder, IsotopeVial
from lib.ProductionJSON import ProductionJSONEncoder
from lib.calenderHelper import combine_date_time, subtract_times
from lib.physics import tracerDecayFactor
from tracerauth.types import LDAPSearchResult
from tracerauth import tracer_ldap
from tracerauth.audit_logging import logFreeInjectionOrder, logCorrectOrder,\
  log_release_isotope_orders, log_correction

debug_logger = logging.getLogger(DEBUG_LOGGER)
audit_logger = logging.getLogger(AUDIT_LOGGER)
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

  def __defaultModelDeserializer(self, model_identifier: str, jsonModel: Dict[str, Any]) -> TracershopModel:
    modelType = MODELS[model_identifier]
    model = modelType.objects.get(pk=jsonModel['id'])
    del jsonModel['id']
    return model


  @database_sync_to_async
  def a_edit_models(self,
                       model_identifier: str,
                       models : Union[Dict, Iterable[Dict]],
                       user: User) -> Optional[List[TracershopModel]]:
    return self.edit_models(model_identifier, models, user)

  def edit_models(self,
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
    if model_identifier in self.__modelSerializer: #pragma: no cover
      # So this is a case of premature perfection
      model = self.__modelSerializer[model_identifier](model_identifier, jsonModel)
    else:
      model = self.__defaultModelDeserializer(model_identifier, jsonModel)
    if not model.canEdit(user):
      return None
    try:
      model.assignDict(jsonModel)
    except Exception as e: #pragma: no cover
      debug_logger.error(e, exc_info=True)
      debug_logger.error(f"Could not assign {jsonModel} to {model}")
      return None

    return model


  @database_sync_to_async
  def a_get_model(self, model: Type[T], identifier: Any, key: Optional[str]=None) -> T:
    return self.get_model(model, identifier, key)

  def get_model(self, model: Type[T], identifier: Any, key: Optional[str]=None) -> T:
    if key is None:
      return model.objects.get(pk=identifier)
    else:
      return model.objects.get(**{ key : identifier})

  @database_sync_to_async
  def a_delete_models(self, modelIdentifier: str, modelID: Any, user: User) -> bool:
    """Deletes one or more model instance, if one or more models cannot be
    deleted, then no models are deleted and this function returns false
    returns true if successfully deleted all models

    """
    # So a performance hic up here is that canDelete must be called on all
    # objects with this notation, secondly delete also calls canDelete again
    # This means this operation "Might" have 3 database quires per object
    # 2 from canDelete, and 1 form the actually deletion
    return self.delete_models(modelIdentifier, modelID, user)

  def delete_models(self, modelIdentifier: str, modelID: Any, user: User) -> bool:
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
      if bool(canDelete):
        deleted = reduce(lambda x, y : x and y, [model.delete(user) for model in models], True)
      else:
        return False
    else:
      model = modelType.objects.get(pk=modelID)
      canDelete = model.canDelete(user)

      if canDelete:
        deleted = model.delete(user)
      else:
        return False
    return deleted


  def __createModel(self, model: Type[T], modelDict: Dict, user: User) -> T:
    instance = model()
    instance.assignDict(modelDict)
    instance.save(user) # Sets primary key as side effect and logs if needed

    return instance

  @database_sync_to_async
  def a_create_models(self, modelIdentifier: str, modelDicts: Union[Dict, List[Dict]], user: User) -> QuerySet[TracershopModel]:
    return self.create_models(modelIdentifier, modelDicts, user)

  def create_models(self, modelIdentifier: str, modelDicts: Union[Dict, List[Dict]], user: User) -> QuerySet[TracershopModel]:
    modelType = getModelType(modelIdentifier)
    if isinstance(modelDicts, List):
      models = [self.__createModel(modelType, modelDict, user) for modelDict in modelDicts]
    else:
      models = [self.__createModel(modelType, modelDicts, user)]

    modelType = MODELS[modelIdentifier]
    return modelType.objects.filter(pk__in=[model.pk for model in models])


  @database_sync_to_async
  def a_save_model(self, model: TracershopModel, user) -> None:
    self.save_model(model, user)


  def save_model(self, model: TracershopModel, user) -> None:
    model.save(user)

  @database_sync_to_async
  def a_release_activity_orders(self,
                    timeSlotID: int,
                    orderIDs: List[int],
                    vialIDs: List[int],
                    user: User,
                    now: datetime) -> Tuple[QuerySet[ActivityOrder],QuerySet[Vial]]:
    return self.release_activity_orders(
      timeSlotID,
      orderIDs,
      vialIDs,
      user,
      now
    )


  def release_activity_orders(self,
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
      audit_logger.error(f"User: {user} attempted to release orders, "
                         "but they have no rights!")
      raise IllegalActionAttempted()

    timeSlot = ActivityDeliveryTimeSlot.objects.get(pk=timeSlotID)
    orders = ActivityOrder.objects.filter(pk__in=orderIDs, status=OrderStatus.Accepted)
    vials = Vial.objects.filter(pk__in=vialIDs, assigned_to=None)

    if len(vials) == 0:
      error_logger.error("Unable to release orders, due to no vials")
      raise UndefinedReference
    if len(orders) == 0:
      error_logger.error("Unable to release orders, due to no orders")
      raise UndefinedReference
    pivot_order = orders[0]

    for order in orders:
      if not (order.moved_to_time_slot == timeSlot or order.ordered_time_slot == timeSlot):
        error_logger.error(f"Attempting to free orders which doesn't belong to timeslot: {timeSlot.id}")
        raise IllegalActionAttempted

      order.status = OrderStatus.Released
      order.freed_by = user
      order.freed_datetime = now

    for vial in vials:
      vial.assigned_to = pivot_order

    # Commit!
    Vial.objects.bulk_update(vials, ['assigned_to'])
    ActivityOrder.objects.bulk_update(orders, ['status', 'freed_by', 'freed_datetime'])

    return orders, vials

  @database_sync_to_async
  def a_release_many_injections_orders(
      self,
      order_ids: List[int],
      lot_number: str,
      release_time: datetime,
      user: User
    ) -> QuerySet[InjectionOrder]:
    return self.release_many_injections_orders(order_ids, lot_number, release_time, user)

  def release_many_injections_orders(
      self,
      order_ids: List[int],
      lot_number: str,
      release_time: datetime,
      user: User
    ) -> QuerySet[InjectionOrder]:
    if not user.is_production_member: #pragma: no cover
      # This is covered by checks in higher up
      raise IllegalActionAttempted

    orders = InjectionOrder.objects.filter(id__in = order_ids, status=OrderStatus.Accepted)

    if len(order_ids) != len(orders):
      raise ValueError(f"There's a missmatch between desired released orders and the database")

    for order in orders:
      order.status = OrderStatus.Released
      order.freed_datetime = release_time
      order.freed_by = user
      order.lot_number = lot_number
      logFreeInjectionOrder(user, order)
      order.save(user) # This is to trigger audit log

    return orders

  @database_sync_to_async
  def a_release_isotope_order(self, data_directory: Dict[str, Any], user: User, now: datetime):
    return self.release_isotope_order(data_directory, user, now)

  def release_isotope_order(self, data_directory: Dict[str, Any], user: User, now: datetime):
    if DATA_ISOTOPE_VIAL not in data_directory or DATA_ISOTOPE_ORDER not in data_directory:
      raise ContractBroken(f"Missing {DATA_ISOTOPE_VIAL} or {DATA_ISOTOPE_ORDER} in data")

    if len(data_directory[DATA_ISOTOPE_ORDER]) == 0 or len(data_directory[DATA_ISOTOPE_VIAL]) == 0:
      raise ContractBroken("Attempting to Release Isotope orders without either vials or orders to fulfill.")

    isotope_orders = IsotopeOrder.objects.filter(pk__in=data_directory[DATA_ISOTOPE_ORDER], status=OrderStatus.Accepted)

    if not self.validate_selection(data_directory[DATA_ISOTOPE_ORDER], isotope_orders):
      raise ContractBroken(f"Attempting to release a not accepted order")

    isotope_vials = IsotopeVial.objects.filter(pk__in=data_directory[DATA_ISOTOPE_VIAL], delivery_with=None)

    if not self.validate_selection(data_directory[DATA_ISOTOPE_VIAL], isotope_vials):
      raise ContractBroken(f"Attempting to double free a vial")

    isotope_order = isotope_orders[0]

    for vial in isotope_vials:
      # I know this CANNOT happen because of the filter, but it's also mostly free
      # Like I have in place incase a refactor does something stupid.
      if vial.delivery_with is not None:
        raise ContractBroken(f"Vial: {vial.id} is already assigned to an order!")
      vial.delivery_with = isotope_order

    for isotope_order in isotope_orders:
      isotope_order.freed_by = user
      isotope_order.freed_datetime = now
      isotope_order.status = OrderStatus.Released
      isotope_order.save(user)

    IsotopeVial.objects.bulk_update(isotope_vials, ['delivery_with'])

    log_release_isotope_orders(user, [io for io in isotope_orders], [iv for iv in isotope_vials])

    return {
      DATA_ISOTOPE_VIAL : [iv for iv in isotope_vials],
      DATA_ISOTOPE_ORDER : [io for io in isotope_orders]
    }

  @database_sync_to_async
  def a_correct_order(self, data: Dict[str, List[int]], user: User) -> Dict[str, List[TracershopModel]]:
    return self.correct_order(data, user)

  def correct_order(self, data: Dict[str, List[int]], user: User) -> Dict[str, List[TracershopModel]]:
    """This function takes committed models, such as orders and vials and


    Args:
        data (Dict[str, List[int]]): _description_
        user (User): _description_

    Raises:
        Exception: _description_

    Returns:
        Dict[str, List[TracershopModel]]: _description_
    """


    return_dict = { }

    for model_identifier, model_ids in data.items():
      model = MODELS[model_identifier]

      filter_args: Dict[str, Any] = {
        'pk__in' : model_ids,
      }

      filter_args.update(model.filter_args_for_committed_models())
      filtered_models = model.objects.filter(**filter_args)

      if not self.validate_selection(model_ids, filtered_models):
        raise Exception(f"Unable to get all {model.__name__} with id: {model_ids}")

      filtered_models.update(**model.kwargs_for_uncommitting())

      log_correction(user, model, model_ids)

      return_dict[model_identifier] = [m for m in filtered_models]

    return return_dict

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
  def a_get_time_sensitive_state(self, central_date: datetime, user: User):
    return self.get_time_sensitive_state(central_date, user)


  def get_time_sensitive_state(self, central_date: datetime, user: User):
    return {
      keyword : self.__modelGetters[keyword](central_date, user)
        for keyword in TIME_SENSITIVE_FIELDS.keys()
    }

  @database_sync_to_async
  def a_serialize_dict(self, instances: Dict[str, Iterable[TracershopModel]]) -> Dict[str,Any]:
    """Transforms some models to a string representation of those models.
    It removes any fields that should not be broadcast such a passwords

    Args:
        instances (Dict[str, Iterable[TracershopModel]]): _description_

    Returns:
        _type_: _description_
    """
    return self.serialize_dict(instances)

  @staticmethod
  def serialize_dict(instances: Dict[str, Iterable[TracershopModel]]) -> Dict[str, Any]:
    serialized_dict = {}

    for key, models in instances.items():
      Model = MODELS[key]
      if not isinstance(models, QuerySet):
        primary_keys = [model.pk for model in models]
        models = Model.objects.filter(pk__in=primary_keys)

      serialized_models = serialize('python', models)
      for serialized_model, model in zip(serialized_models, models):
        fields = serialized_model['fields']
        for keyword in Model.exclude: #type: ignore
          del fields[keyword]
        for property_name in Model.derived_properties: # type: ignore
          fields[property_name] = getattr(model, property_name)

      serialized_dict[key] = serialized_models

    return serialized_dict

  def get_models(self, user: User) -> List[Type[TracershopModel]]:
    return [model for model in apps.get_app_config('database').get_models()
                # This line is here to ensure models are the correct type
                # As django might add some models for itself
                if issubclass(model, TracershopModel)]

  @database_sync_to_async
  def a_get_state(self, reference_time: datetime, user: User) -> Dict[str, List[TracershopModel]]:
    return self.get_state(reference_time, user)

  def get_state(self, referenceTime: datetime, user: User) -> Dict[str, List[TracershopModel]]:
    models = self.get_models(user)
    instances = {}
    for model in models:
      modelKeyword = INVERTED_MODELS.get(model)
      if modelKeyword is None or modelKeyword in EXCLUDED_STATE_MODELS:
        #debug_logger.warning(f"ModelKeyword {model.__name__} is missing in database.models.INVERTED_MODELS")
        continue
      if modelKeyword in self.__modelGetters:
        instances[modelKeyword] = self.__modelGetters[modelKeyword](referenceTime, user)
      else:
        instances[modelKeyword] = model.objects.all()
    return instances

  @database_sync_to_async
  def a_move_orders(self, orderIDs: List[int], destinationID: int):
    return self.move_orders(orderIDs, destinationID)

  def move_orders(self, orderIDs: List[int], destinationID: int):
    orders = ActivityOrder.objects.filter(pk__in=orderIDs)
    destination = ActivityDeliveryTimeSlot.objects.get(pk=destinationID)

    if(len(orderIDs) == 0):
      error_logger.error("Attempting to move 0 orders. Frontend fucked up!")

    for order in orders:
      if OrderStatus(order.status) == OrderStatus.Released:
          error_logger.error("Attempted to move a released order")
          raise IllegalActionAttempted
      if order.ordered_time_slot != destination:
        # Guard Clauses for assumptions
        if order.ordered_time_slot.destination != destination.destination:
          error_logger.error("Attempted to set Destination to another endpoints time slot")
          raise IllegalActionAttempted
        if order.ordered_time_slot.production_run.production_day != destination.production_run.production_day:
          error_logger.error("Attempted to set Destination to another time slot produced on another day")
          raise IllegalActionAttempted
        if order.ordered_time_slot.delivery_time < destination.delivery_time:
          error_logger.error(f"Attempted to move an order that should have been delivered: {order.ordered_time_slot.delivery_time} to a time slot which delivers {destination.delivery_time}")
          raise IllegalActionAttempted

        order.moved_to_time_slot = destination
      else:
        # Restore orders
        order.moved_to_time_slot = None

    # Note that bulk update skips the validation in the save method
    ActivityOrder.objects.bulk_update(orders, ['moved_to_time_slot'])

    return orders

  @database_sync_to_async
  def a_restore_destinations(self, orderIDs: List[int]):
    return self.restore_destinations(orderIDs)


  def restore_destinations(self, orderIDs: List[int]):
    orders = ActivityOrder.objects.filter(pk__in=orderIDs)
    for order in orders:
      order.moved_to_time_slot = None
    ActivityOrder.objects.bulk_update(orders, ['moved_to_time_slot'])
    return orders

  @database_sync_to_async
  def a_get_related_customer_ids(self, user: User) -> List[int]:
    return self.get_related_customer_ids(user)

  def get_related_customer_ids(self, user: User) -> List[int]:
    userAssignments = UserAssignment.objects.filter(user=user)

    return [userAssignment.customer.id
              for userAssignment in userAssignments]

  @database_sync_to_async
  def a_create_user_assignment(self,
                           username : str,
                           customer_id : int,
                           creating_user) -> Tuple[SUCCESS_STATUS_CRUD,
                                                   Optional[UserAssignment],
                                                   Optional[User]]:
    return self.create_user_assignment(username, customer_id, creating_user)

  def create_user_assignment(self,
                           username : str,
                           customer_id : int,
                           creating_user) -> Tuple[SUCCESS_STATUS_CRUD,
                                                   Optional[UserAssignment],
                                                   Optional[User]]:
    try:
      customer = Customer.objects.get(pk=customer_id)
    except ObjectDoesNotExist:
      error_logger.info(f"User {creating_user} tried to create an association between {username} and a non-existent customer")
      return SUCCESS_STATUS_CRUD.MISSING_CUSTOMER, None, None

    user = None
    try:
      user = User.objects.get(username=username)
      user_created = False
    except ObjectDoesNotExist:
      success, ldap_user_group = tracer_ldap.checkUserGroupMembership(username)
      if success == LDAPSearchResult.USER_DOES_NOT_EXISTS:
        return SUCCESS_STATUS_CRUD.NO_LDAP_USERNAME, None, None

      if success == LDAPSearchResult.MISSING_USER_GROUP:
        return SUCCESS_STATUS_CRUD.NO_GROUPS, None, None

      if ldap_user_group in [UserGroups.ShopAdmin, UserGroups.ShopUser]:
        user_created = True
        user = User.objects.create(username=username.upper(), user_group=ldap_user_group)
      else:
        return SUCCESS_STATUS_CRUD.INCORRECT_GROUPS, None, None

    if not user.user_group in [UserGroups.ShopAdmin, UserGroups.ShopUser]:
      return SUCCESS_STATUS_CRUD.INCORRECT_GROUPS, None, None

    try:
      user_assignment = UserAssignment(user=user, customer=customer)
      created = user_assignment.save(creating_user)
    except IntegrityError:
      return SUCCESS_STATUS_CRUD.DUPLICATE_ASSIGNMENT, None, None

    if not created:
      return SUCCESS_STATUS_CRUD.UNABLE_TO_CREATE_USER_ASSIGNMENT, None, None

    if user_created:
      return SUCCESS_STATUS_CRUD.SUCCESS, user_assignment, user
    else:
      return SUCCESS_STATUS_CRUD.SUCCESS, user_assignment, None

  @database_sync_to_async
  def a_mass_order(self, bookings: Dict[str, bool], user: User):
    return self.mass_order(bookings, user)

  def mass_order(self, bookings: Dict[str, bool], user: User):
    timeSlotsBookings: Dict[ActivityDeliveryTimeSlot, float] = {}
    injectionOrders: List[InjectionOrder] = []
    activityOrders: List[ActivityOrder] = []
    bookingUpdated: List[Booking] = []

    bookingDate = date(1970, 1 ,1)

    for accessionNumber, ordering in bookings.items():
      try:
        booking = Booking.objects.get(accession_number=accessionNumber)
      except ObjectDoesNotExist:
        # This is a silent error!
        #
        # So how can this happen?
        error_logger.error(f"Booking for accession number: {accessionNumber} have no matching backend copy")
        continue

      bookingDate = booking.start_date
      endpoint = booking.location.endpoint
      procedureIdentifier = booking.procedure

      if endpoint is None:
        error_logger.error(f"Booking {booking} is being ordered, but its location: {booking.location} has no associated endpoint!")
        raise RequestingNonExistingEndpoint(booking.start_time, None)

      try:
        procedure = Procedure.objects.get(series_description=procedureIdentifier,
                                          owner=endpoint)
      except ObjectDoesNotExist:
        error_logger.error(f"for Booking {booking.accession_number} Could not "
                           "find a matching procedure for DeliveryEndpoint: "
                           f"{endpoint} and series description: {procedureIdentifier}")
        continue
      except MultipleObjectsReturned: # pragma: no cover
        # There's a unique_together that prevents this line from being relevant
        error_message = "Database corruption! Multiple Procedures are "\
                       f"associated with DeliveryEndpoint: {endpoint} "\
                       f"and series description: {procedureIdentifier}"
        error_logger.critical(error_message)
        raise ContractBroken(error_message)

      tracer = procedure.tracer

      if not ordering:
        booking.status = BookingStatus.Rejected
        bookingUpdated.append(booking)
        continue

      # Muh Turnery Operation, mate that would NOT fit in a turnery
      if tracer.tracer_type == TracerTypes.InjectionBased:
        injectionOrders.append(InjectionOrder(
          delivery_time=booking.start_time,
          delivery_date=booking.start_date,
          injections=procedure.tracer_units,
          status=OrderStatus.Ordered,
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
          tracer=tracer
        )
        booking_time = combine_date_time(booking.start_date, booking.start_time)\
          + timedelta(minutes=procedure.delay_minutes)
        timeSlots = ActivityDeliveryTimeSlot.objects.filter(
          destination=endpoint,
          production_run__in=productions,
          delivery_time__lte=booking_time.time()
        ).order_by('delivery_time').reverse()

        if len(timeSlots) == 0:
          min_time = time(23,59,59)
          for time_slot in ActivityDeliveryTimeSlot.objects.filter(
              destination=endpoint,
              production_run__in=productions,
            ):
            min_time = min(time_slot.delivery_time, min_time)


          error_logger.error(f"Booking: {booking} is being ordered to {endpoint} at {booking.start_time}, but that endpoint doesn't have any ActivityDeliveryTimeSlots to {Days(day).name}")
          error_logger.error(f"Productions: {productions}")
          error_logger.error(f"Booking Time: {booking_time}")
          raise RequestingNonExistingEndpoint(booking.start_time, min_time)
        timeSlot = timeSlots[0]
        timeDelta = subtract_times(booking_time.time(), timeSlot.delivery_time)

        activity = procedure.tracer_units / tracerDecayFactor(tracer, timeDelta.seconds)

        if timeSlot not in timeSlotsBookings:
          timeSlotsBookings[timeSlot] = 0
        timeSlotsBookings[timeSlot] += activity

        booking.status = BookingStatus.Ordered
      debug_logger.debug(f"Scheduling {booking} for update")
      bookingUpdated.append(booking)
    # End of booking iteration

    for timeSlot, activity in timeSlotsBookings.items():
      activityOrders.append(
        ActivityOrder(
          ordered_activity=floor(activity),
          delivery_date=bookingDate,
          status=OrderStatus.Ordered,
          comment="",
          ordered_time_slot=timeSlot,
          ordered_by=user
        )
      )

    debug_logger.debug(f"Creating {len(activityOrders)} activity bookings")
    activityOrders = ActivityOrder.objects.bulk_create(activityOrders)
    debug_logger.debug(f"Creating {len(injectionOrders)} Injections bookings")
    injectionsOrders = InjectionOrder.objects.bulk_create(injectionOrders)
    debug_logger.debug(f"Updating {len(bookingUpdated)} Bookings")
    Booking.objects.bulk_update(bookingUpdated, ['status'])

    return {
      DATA_ACTIVITY_ORDER : activityOrders,
      DATA_INJECTION_ORDER : injectionsOrders
    }

  @database_sync_to_async
  def a_get_bookings(self, date_: date, delivery_endpoint_id: int) -> Dict[str, List[Booking]]:
    return self.get_bookings(date_, delivery_endpoint_id)

  def get_bookings(self, date_: date, delivery_endpoint_id: int) -> Dict[str, List[Booking]]:
    """Gets the stored bookings for the endpoint id for a specific date and
    returns them ready to be serialized by the engine, ie you can throw the
    returned object in to a message and the infra will convert it to good json

    Args:
        date_ (date): Date to retrieve bookings from
        delivery_endpoint_id (int): The Endpoint you want bookings from

    Returns:
      Dict[str, List[Bookings]] - with a single key - booking
    """
    locations = Location.objects.filter(
      endpoint__id=delivery_endpoint_id,
    )
    bookings = Booking.objects.filter(
      location__in=locations,
      start_date=date_
    )

    return {
      DATA_BOOKING : [b for b in bookings]
    }

  @database_sync_to_async
  def a_create_external_user(self, user_skeleton: Dict[str, Any]):
    return self.create_external_user(user_skeleton)


  def create_external_user(self, user_skeleton: Dict[str, Any]):
    """Create an external user

    Args:
        userSkeleton (Dict[str, Any]): Message containing:
          * AUTH_USERNAME - string - the username of the new user
          * AUTH_PASSWORD - string - the password of the new user
          * DATA_CUSTOMER - Optional int - if defined, the customer the user
                                           represents.
    """
    newExternalUser = User(username=user_skeleton[AUTH_USERNAME],
                           user_group=UserGroups.ShopExternal)

    newExternalUser.set_password(user_skeleton[AUTH_PASSWORD])
    newExternalUser.save()

    if DATA_CUSTOMER in user_skeleton and user_skeleton[DATA_CUSTOMER]:
      customer = Customer.objects.get(pk=user_skeleton[DATA_CUSTOMER])

      newUserAssignment = UserAssignment(user=newExternalUser, customer=customer)
      newUserAssignment.save()
    else:
      newUserAssignment = None

    return newExternalUser, newUserAssignment

  @database_sync_to_async # This is just to get a sync environment.
  def a_change_external_password(self, external_user_id : int, external_new_password: str):
    return self.change_external_password(external_user_id, external_new_password)

  def change_external_password(self, external_user_id : int, external_new_password: str):
    """changes the password of a user

    Args:
        externalUserID (int): The
        externalNewPassword (string): _description_

    Raises:
        IllegalActionAttempted: _description_
    """
    externalUser = User.objects.get(pk=external_user_id)
    if externalUser.user_group != UserGroups.ShopExternal:
      raise IllegalActionAttempted
    externalUser.set_password(external_new_password)
    externalUser.save()

  def get_csv_data(self, csv_date: date) -> Dict[str, Dict[str, List[Any]]]:
    """Extracts data from Database regarding orders and vials completed the
    month of the csv_date argument.

    Args:
    """

    _, end_date_num = monthrange(csv_date.year, csv_date.month)

    start_date = date(csv_date.year, csv_date.month, 1)
    end_date = date(csv_date.year, csv_date.month, end_date_num)

    activity_orders = ActivityOrder.objects.filter(
      delivery_date__gte=start_date,
      delivery_date__lte=end_date,
      status=OrderStatus.Released,
    ).order_by(
      'ordered_time_slot__production_run__tracer',
      'delivery_date'
    )

    injection_orders = InjectionOrder.objects.filter(
      delivery_date__gte=start_date,
      delivery_date__lte=end_date,
      status=OrderStatus.Released,
    ).order_by(
      'tracer',
      'delivery_date'
    )

    vials = Vial.objects.filter(
      fill_date__gte=start_date,
      fill_date__lte=end_date,
    ).order_by(
      'fill_date', 'fill_time'
    )

    return_dir: Dict[str, Dict[str, List[Any]]] = {}

    for activity_order in activity_orders:
      owner = activity_order.ordered_time_slot.destination.owner
      if owner.short_name not in return_dir:
        return_dir[owner.short_name] = {
          'Ordre id' : [],
          'Tracer' : [],
          'Dato' : [],
          'Bestilt MBq' : [],
          'Injektioner' : [],
          'Bestilt tidspunkt' : [],
          'Frigivelse tidspunkt' : [],
          'Udleveret MBq' : [],
        }

      owner_dict = return_dir[owner.short_name]
      owner_dict['Ordre id'].append(f"A-{activity_order.id}")
      owner_dict['Tracer'].append(activity_order.ordered_time_slot.production_run.tracer.shortname)
      owner_dict['Dato'].append(activity_order.delivery_date)
      owner_dict['Bestilt MBq'].append(activity_order.ordered_activity)
      owner_dict['Bestilt tidspunkt'].append(activity_order.ordered_time_slot.delivery_time)
      owner_dict['Injektioner'].append(0)

      assigned_mbq = Vial.objects.filter(
          assigned_to=activity_order
        ).aggregate(Sum('activity'))['activity__sum']

      formatted_assigned_mbq = assigned_mbq if assigned_mbq is not None else 0

      owner_dict['Udleveret MBq'].append(formatted_assigned_mbq)

      if activity_order.freed_datetime is None:
        freed_datetime = "Ukendt"
      else:
        freed_datetime = activity_order.freed_datetime.astimezone(
          ZoneInfo('Europe/Copenhagen')
        ).replace(tzinfo=None)

      owner_dict['Frigivelse tidspunkt'].append(freed_datetime)

    for injection_order in injection_orders:
      owner = injection_order.endpoint.owner
      if owner.short_name not in return_dir:
        return_dir[owner.short_name] = {
          'Ordre id' : [],
          'Tracer' : [],
          'Dato' : [],
          'Bestilt MBq' : [],
          'Injektioner' : [],
          'Bestilt tidspunkt' : [],
          'Frigivelse tidspunkt' : [],
          'Udleveret MBq' : [],
        }

      owner_dict = return_dir[owner.short_name]
      owner_dict['Ordre id'].append(f"I-{injection_order.id}")
      owner_dict['Tracer'].append(injection_order.tracer.shortname)
      owner_dict['Dato'].append(injection_order.delivery_date)
      owner_dict['Bestilt MBq'].append(0)
      owner_dict['Udleveret MBq'].append(0)
      owner_dict['Bestilt tidspunkt'].append(injection_order.delivery_time)
      owner_dict['Injektioner'].append(injection_order.injections)
      if injection_order.freed_datetime is None:
        freed_datetime = "Ukendt"
      else:
        freed_datetime = injection_order.freed_datetime.astimezone(
          ZoneInfo('Europe/Copenhagen')
        ).replace(tzinfo=None)
      owner_dict['Frigivelse tidspunkt'].append(freed_datetime)

    return_dir['Hætteglas'] = {
      'Tracer' : [],
      'Aktivity' : [],
      'Volumen' : [],
      'Batch nummer' : [],
      'Dato' : [],
      'Tappe tidspunkt' : [],
      'Ejer' : []
    }

    vial_dir = return_dir['Hætteglas']
    for vial in vials:
      if vial.tracer is None:
        vial_dir['Tracer'].append('Ukendt')
      else:
        vial_dir['Tracer'].append(vial.tracer.shortname)
      vial_dir['Aktivity'].append(vial.activity)
      vial_dir['Volumen'].append(vial.volume)
      vial_dir['Batch nummer'].append(vial.lot_number)
      vial_dir['Dato'].append(vial.fill_date)
      vial_dir['Tappe tidspunkt'].append(vial.fill_time)
      if vial.owner is None:
        vial_dir['Ejer'].append('Ukendt Kunde')
      else:
        vial_dir['Ejer'].append(vial.owner.short_name)

    return return_dir

  @database_sync_to_async
  def a_get_telemetry_data(self):
    return self.get_telemetry_data()


  def get_telemetry_data(self):
    """Get all the telemetry data

    Returns:
        str: JSON string of all the telemetry data
    """

    with connection.cursor() as cursor:
      cursor.execute("""
        SELECT
          request_type_id,COUNT(latency_ms), AVG(latency_ms), STD(latency_ms)
        FROM
          database_telemetryrecord
        GROUP BY request_type_id
      """)
      records = cursor.fetchall()

    requests = TelemetryRequest.objects.all()

    return_dict = self.serialize_dict({
      DATA_TELEMETRY_REQUEST : requests
    })

    return_dict[DATA_TELEMETRY_RECORD] = records

    return return_dict

  def validate_selection[T : TracershopModel](self, ids: List[int], filtered_objects: BaseManager[T]):
    """When selecting objects, various sanity checks are applied, this function
       does a simple check, that no sanity checks were violated.

    Logs error to error_logger, so one should raise / return an error value if
    this function returns false

    Args:
        ids (List[int]): The original list of ids, that was part of filter
        filtered_objects (BaseManager[TracershopModel]): The result of the filter
          Note that it's an assumption that an argument to the filtering
          have been id__in=ids or pk__in=ids

    Returns:
        boolean: if sanity constraint holds.
    """
    if(len(ids) == 0):
      error_logger.error("Attempted to filter for no ids.")
      return False

    if(len(ids) == len(filtered_objects)):
      # While the error case covers more ground, it's more to grant an easier
      # time debugging
      return True

    # Okay something is wrong
    missing_ids = set(ids)
    extra_objects = set[int]()

    for obj in filtered_objects:
      if obj.id in missing_ids:
        missing_ids.remove(obj.id)
      else:
        extra_objects.add(obj.id)

    error_message = f"While attempting to retrieve: {ids}, the following object are missing: {[id_ for id_ in missing_ids]}"
    error_logger.error(error_message)

    return False

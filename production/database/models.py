# Python Standard Library
from typing import Dict, Tuple, Type, TypeVar

# Third Party Packages
from django.core.exceptions import ObjectDoesNotExist

# Packages Tracershop
from shared_constants import DATA_TRACER,DATA_BOOKING,  DATA_TRACER_MAPPING, DATA_VIAL,\
    DATA_PRODUCTION, DATA_ISOTOPE, DATA_INJECTION_ORDER,  DATA_DELIVER_TIME, \
    DATA_ADDRESS, DATA_CUSTOMER, DATA_DATABASE, DATA_SERVER_CONFIG,\
    DATA_ACTIVITY_ORDER, DATA_CLOSED_DATE, DATA_LOCATION, DATA_ENDPOINT,\
    DATA_SECONDARY_EMAIL, DATA_PROCEDURE, DATA_USER, DATA_USER_ASSIGNMENT,\
    DATA_MESSAGE, DATA_MESSAGE_ASSIGNMENT, DATA_DEADLINE, DATA_DICOM_ENDPOINT,\
    DATA_LEGACY_PRODUCTION_MEMBER, DATA_PROCEDURE_IDENTIFIER, DATA_RELEASE_RIGHT,\
    DATA_SERVER_LOG
from database.TracerShopModels.authModels import *
from database.TracerShopModels.baseModels import TracershopModel
from database.TracerShopModels.clinicalModels import *
from database.TracerShopModels.customerModels import *
from database.TracerShopModels.networkModels import *
from database.TracerShopModels.serverModels import *

MODELS: Dict[str, Type[TracershopModel]] = {
  DATA_ADDRESS : Address,
  DATA_ACTIVITY_ORDER : ActivityOrder,
  DATA_BOOKING : Booking, # Note that this is not visible in state
  DATA_CLOSED_DATE : ClosedDate,
  DATA_CUSTOMER : Customer,
  DATA_DEADLINE : Deadline,
  DATA_DELIVER_TIME : ActivityDeliveryTimeSlot,
  DATA_DICOM_ENDPOINT : DicomEndpoint,
  DATA_ENDPOINT : DeliveryEndpoint,
  DATA_INJECTION_ORDER : InjectionOrder,
  DATA_ISOTOPE : Isotope,
  DATA_RELEASE_RIGHT : ReleaseRight,
  #DATA_LEGACY_ACTIVITY_ORDER : LegacyActivityOrder, # We shouldn't need these in frontend
  #DATA_LEGACY_INJECTION_ORDER : LegacyInjectionOrder, # We shouldn't need these in frontend
  DATA_LEGACY_PRODUCTION_MEMBER : LegacyProductionMember,
  DATA_LOCATION : Location,
  DATA_MESSAGE : Message,
  DATA_MESSAGE_ASSIGNMENT : MessageAssignment,
  DATA_TRACER : Tracer,
  DATA_TRACER_MAPPING : TracerCatalogPage,
  DATA_PROCEDURE : Procedure,
  DATA_PROCEDURE_IDENTIFIER : ProcedureIdentifier,
  DATA_PRODUCTION : ActivityProduction,
  DATA_SECONDARY_EMAIL : SecondaryEmail,
  DATA_SERVER_CONFIG : ServerConfiguration,
  DATA_SERVER_LOG : ServerLog,
  DATA_USER : User,
  DATA_USER_ASSIGNMENT : UserAssignment,
  DATA_VIAL : Vial,
}

INVERTED_MODELS = {
  model : key for key, model in MODELS.items()
}

TIME_SENSITIVE_FIELDS : Dict[str, str] = {
  DATA_ACTIVITY_ORDER :  'delivery_date',
  DATA_CLOSED_DATE : 'close_date',
  DATA_INJECTION_ORDER : 'delivery_date',
  DATA_VIAL : 'fill_date',

}


T = TypeVar('T', bound=TracershopModel)

def getOrCreateModel(key, Model: Type[T], keyWord: str) -> T:
  """Gets a model with a field, if it doesn't exists, creates a new instance.

  Caller is responsible for saving, and filling fields, that may be required.

  Args:
    key (_type_): value of keyword of model, must be of type the field referenced by keyword
    Model (Type[T]): The Type of the model to be created
    keyWord (str): The filtering keyword, must be field in Model

  Returns:
    T: a Model instance,

  Throws:
    django.core.exceptions.MultipleInstances: - if multiple objects exists
  """

  # I just want to explain the difference between this and  get_or_create from django
  # So this allow to you dynammicly get or create models without knowing the model
  # until runtime.

  keyDict = {keyWord : key}
  try:
    model = Model.objects.get(**keyDict)
  except ObjectDoesNotExist:
    model = Model(**keyDict)
  return model


def getModelType(identifier: str) -> Type[TracershopModel]:
  return MODELS[identifier] # type ignore

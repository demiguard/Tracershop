# Python Standard Library
from typing import Dict, Tuple, Type, TypeVar

# Third Party Packages
from django.core.exceptions import ObjectDoesNotExist

# Packages Tracershop
from shared_constants import JSON_TRACER,JSON_BOOKING,  JSON_TRACER_MAPPING, JSON_VIAL,\
    JSON_PRODUCTION, JSON_ISOTOPE, JSON_INJECTION_ORDER,  JSON_DELIVER_TIME, \
    JSON_ADDRESS, JSON_CUSTOMER, JSON_DATABASE, JSON_SERVER_CONFIG,\
    JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_LOCATION, JSON_ENDPOINT,\
    JSON_SECONDARY_EMAIL, JSON_PROCEDURE, JSON_USER, JSON_USER_ASSIGNMENT,\
    JSON_MESSAGE, JSON_MESSAGE_ASSIGNMENT, JSON_DEADLINE, JSON_DICOM_ENDPOINT,\
    JSON_LEGACY_PRODUCTION_MEMBER, JSON_PROCEDURE_IDENTIFIER, JSON_RELEASE_RIGHT
from database.TracerShopModels.authModels import *
from database.TracerShopModels.baseModels import TracershopModel
from database.TracerShopModels.clinicalModels import *
from database.TracerShopModels.customerModels import *
from database.TracerShopModels.networkModels import *
from database.TracerShopModels.serverModels import *

MODELS: Dict[str, Type[TracershopModel]] = {
  JSON_ADDRESS : Address,
  JSON_ACTIVITY_ORDER : ActivityOrder,
  JSON_BOOKING : Booking,
  JSON_CLOSED_DATE : ClosedDate,
  JSON_CUSTOMER : Customer,
  JSON_DEADLINE : Deadline,
  JSON_DELIVER_TIME : ActivityDeliveryTimeSlot,
  JSON_DICOM_ENDPOINT : DicomEndpoint,
  JSON_ENDPOINT : DeliveryEndpoint,
  JSON_INJECTION_ORDER : InjectionOrder,
  JSON_ISOTOPE : Isotope,
  JSON_RELEASE_RIGHT : ReleaseRight,
  #JSON_LEGACY_ACTIVITY_ORDER : LegacyActivityOrder, # We shouldn't need these in frontend
  #JSON_LEGACY_INJECTION_ORDER : LegacyInjectionOrder, # We shouldn't need these in frontend
  JSON_LEGACY_PRODUCTION_MEMBER : LegacyProductionMember,
  JSON_LOCATION : Location,
  JSON_MESSAGE : Message,
  JSON_MESSAGE_ASSIGNMENT : MessageAssignment,
  JSON_TRACER : Tracer,
  JSON_TRACER_MAPPING : TracerCatalogPage,
  JSON_PROCEDURE : Procedure,
  JSON_PROCEDURE_IDENTIFIER : ProcedureIdentifier,
  JSON_PRODUCTION : ActivityProduction,
  JSON_SECONDARY_EMAIL : SecondaryEmail,
  JSON_SERVER_CONFIG : ServerConfiguration,
  JSON_USER : User,
  JSON_USER_ASSIGNMENT : UserAssignment,
  JSON_VIAL : Vial,
}

INVERTED_MODELS = {
  model : key for key, model in MODELS.items()
}

TIME_SENSITIVE_FIELDS : Dict[str, str] = {
  JSON_ACTIVITY_ORDER :  'delivery_date',
  JSON_CLOSED_DATE : 'close_date',
  JSON_INJECTION_ORDER : 'delivery_date',
  JSON_VIAL : 'fill_date',

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
  keyDict = {keyWord : key}
  try:
    model = Model.objects.get(**keyDict)
  except ObjectDoesNotExist:
    model = Model(**keyDict)
  return model


def getModelType(identifier: str) -> Type[TracershopModel]:
  return MODELS[identifier] # type ignore


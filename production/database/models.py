# Python Standard Library
from typing import Dict, Type

# Packages Tracershop
from constants import JSON_TRACER,JSON_BOOKING,  JSON_TRACER_MAPPING, JSON_VIAL,\
    JSON_PRODUCTION, JSON_ISOTOPE, JSON_INJECTION_ORDER,  JSON_DELIVERTIME, \
    JSON_ADDRESS, JSON_CUSTOMER, JSON_DATABASE, JSON_SERVER_CONFIG,\
    JSON_ACTIVITY_ORDER, JSON_CLOSEDDATE, JSON_LOCATION, JSON_ENDPOINT,\
    JSON_SECONDARY_EMAIL, JSON_PROCEDURE, JSON_USER, JSON_USER_ASSIGNMENT,\
    JSON_MESSAGE, JSON_MESSAGE_ASSIGNMENT
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
  JSON_CLOSEDDATE : ClosedDate,
  JSON_CUSTOMER : Customer,
  JSON_DATABASE : Database,
  JSON_DELIVERTIME : ActivityDeliveryTimeSlot,
  JSON_ENDPOINT : DeliveryEndpoint,
  JSON_INJECTION_ORDER : InjectionOrder,
  JSON_ISOTOPE : Isotope,
  JSON_LOCATION : Location,
  JSON_MESSAGE : Message,
  JSON_MESSAGE_ASSIGNMENT : MessageAssignment,
  JSON_TRACER : Tracer,
  JSON_TRACER_MAPPING : TracerCatalog,
  JSON_PROCEDURE : Procedure,
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


def getModel(identifier: str) -> Type[TracershopModel]:
    return MODELS[identifier]


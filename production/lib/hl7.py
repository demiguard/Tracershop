# Python standard library
from enum import Enum
from logging import getLogger

# Third party modules
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist

# Tracershop modules
from constants import PING_SERVICE_LOGGER
from database.models import Location, ProcedureIdentifier

class SupportedHL7Messages(Enum):
  CREATE_BOOKING = 1
  DELETE_BOOKING = 2



### EXTRACTION

def extract_location(OBR_message_segment):
  location_code_ = OBR_message_segment[21][0]
  location, created = Location.objects.get_or_create(location_code=location_code_)

  if created:
    logger = getLogger(PING_SERVICE_LOGGER)
    logger.info(f"Created a location with code: {location}")

@database_sync_to_async
def a_extract_location(ORC_message_segment):
  return extract_location(ORC_message_segment)

@database_sync_to_async
def get_or_create_procedureIdentifier(code: str, description: str) -> ProcedureIdentifier:
  """Retrieves procedureIdentifier from the HL7 message

  Args:
      code (str): The code for procedure
      description (str): Description

  Returns:
      _type_: _description_
  """
  logger = getLogger(PING_SERVICE_LOGGER)
  try:
    procedure_identifier = ProcedureIdentifier.objects.get(code=code)
    if procedure_identifier.description != description:
      logger.info(f"Changing description from {procedure_identifier.description} to {description} for code {code}")
      procedure_identifier.description = description
      procedure_identifier.save()
  except ObjectDoesNotExist:
    try:
      procedure_identifier = ProcedureIdentifier.objects.get(description=description)
      procedure_identifier.code = code
      logger.info(f"Changing code from {procedure_identifier.code} to {code} for description {description}")
      procedure_identifier.save()
    except ObjectDoesNotExist:
      procedure_identifier, created = ProcedureIdentifier.objects.get_or_create(code=code, description=description)
      if created:
        logger.info(f"Created Procedure Identifier with code: {code} and description: {description}")

  return procedure_identifier

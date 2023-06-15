# Python Standard Library
from datetime import datetime
from typing import Any,Callable, Dict, Iterable, List, Type

# Third party Libraries
from channels.db import database_sync_to_async
from django.apps import apps
from django.contrib.auth.models import AnonymousUser

# Tracershop App
from constants import *
from database.models import User, UserGroups, TracershopModel, Tracer, INVERTED_MODELS, MODELS

requiredMessageFields = {
  WEBSOCKET_MESSAGE_AUTH_LOGIN : [JSON_AUTH],
  WEBSOCKET_MESSAGE_FREE_INJECTION : [WEBSOCKET_DATA, JSON_AUTH],
  WEBSOCKET_MESSAGE_GET_STATE : [],
  WEBSOCKET_MESSAGE_MODEL_DELETE : [WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE]
}

requiredDataFields = {
  WEBSOCKET_MESSAGE_FREE_INJECTION : [(LEGACY_KEYWORD_OID, int), (LEGACY_KEYWORD_BATCHNR, str)]
}


def ValidateAuthObject(AuthObj: Dict) -> bool:
  """Validates that the auth object contains a username and password

  Username name might not exists and if it does password may not be correct.

  Args:
      message (Dict): An object that should contain AUTH_USERNAME and AUTH_PASSWORD

  Returns:
      bool: Validity of Auth object
  """
  # Auth object should always contain a username and a password
  return AUTH_USERNAME in AuthObj and AUTH_PASSWORD in AuthObj

def ValidateType(value : Any, targetType: Type) -> bool:
  """Checks if a value is of a certain type

  Args:
      value (_type_): _description_
      targetType (_type_): _description_

  Returns:
      bool: _description_
  """

  return True

def AuthMessage(user: User, message: Dict) -> bool:
  """Check if a user is allowed to send a message

  Args:
      user (User): _description_
      messageType (str): _description_

  Returns:
      bool: If the user is allowed to handle such a message
  """
  messageType = message[WEBSOCKET_MESSAGE_TYPE]

  if messageType in [
    WEBSOCKET_MESSAGE_AUTH_LOGIN,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI,
    WEBSOCKET_MESSAGE_ECHO]: # Global Messages
    return True
  if isinstance(user, AnonymousUser):
    return False
  if user.UserGroup == UserGroups.Admin:
    return True
  if user.UserGroup == UserGroups.ProductionAdmin:
    if messageType in [
        WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_MESSAGE_FREE_ACTIVITY,
        WEBSOCKET_MESSAGE_FREE_INJECTION,
        WEBSOCKET_MESSAGE_MOVE_ORDERS,
        WEBSOCKET_MESSAGE_ECHO,
        WEBSOCKET_MESSAGE_GET_ORDERS,
        WEBSOCKET_UPDATE_SERVERCONFIG,
        WEBSOCKET_MESSAGE_EDIT_STATE,
        WEBSOCKET_MESSAGE_DELETE_DATA_CLASS]:
      return True
    else:
      return False

  if user.UserGroup == UserGroups.ProductionUser:
    if messageType in [
        WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_MESSAGE_FREE_ACTIVITY,
        WEBSOCKET_MESSAGE_FREE_INJECTION,
        WEBSOCKET_MESSAGE_MOVE_ORDERS,
        WEBSOCKET_MESSAGE_ECHO,
        WEBSOCKET_MESSAGE_GET_ORDERS,
        WEBSOCKET_UPDATE_SERVERCONFIG,
        WEBSOCKET_MESSAGE_EDIT_STATE,
        WEBSOCKET_MESSAGE_DELETE_DATA_CLASS]:
      return True
    else:
      return False

  if user.UserGroup == UserGroups.ShopAdmin:
    if messageType in []:
      return True
    else:
      return False

  if user.UserGroup == UserGroups.ShopUser:
    if messageType in []:
      return True
    else:
      return False

  if user.UserGroup == UserGroups.ShopExternal:
    if messageType in []:
      return True
    else:
      return False

def validateMessage(message : Dict) -> str:
  """Checks is a message contains the correct fields to be a valid message.
  Note a valid message is returned as falsy, while a truthy indicate an error.

  Args:
      message (Dict): The message to be validated

  Returns:
      str: empty if valid otherwise a ERROR_XXX from constants.py is returned
  """
  if not message.get(WEBSOCKET_MESSAGE_ID):
    return ERROR_NO_MESSAGE_ID
  if not message.get(WEBSOCKET_MESSAGE_TYPE):
    return ERROR_NO_MESSAGE_TYPE
  if not message[WEBSOCKET_MESSAGE_TYPE] in WEBSOCKET_MESSAGE_TYPES:
    return ERROR_INVALID_MESSAGE_TYPE
  if not message.get(WEBSOCKET_JAVASCRIPT_VERSION):
    return ERROR_NO_JAVASCRIPT_VERSION
  if not message[WEBSOCKET_JAVASCRIPT_VERSION] == JAVASCRIPT_VERSION:
    return ERROR_INVALID_JAVASCRIPT_VERSION

  for field in requiredMessageFields.get(message[WEBSOCKET_MESSAGE_TYPE], []):
    if field not in message:
      return ERROR_INVALID_MESSAGE

  if WEBSOCKET_DATA in message:
    data = message[WEBSOCKET_DATA]
    for field, Type in requiredDataFields.get(message[WEBSOCKET_MESSAGE_TYPE], []):
      if field not in data or not ValidateType(data[field], Type):
        return ERROR_INSUFFICIENT_DATA

  if JSON_AUTH in message and not ValidateAuthObject(message[JSON_AUTH]):
    return ERROR_INVALID_AUTH

  return ""


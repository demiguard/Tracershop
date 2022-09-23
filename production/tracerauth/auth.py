from django.contrib.auth.models import AnonymousUser

from constants import *
from database.models import User, UserGroups
from typing import Dict

def AuthMessage(user : User, message : Dict) -> bool:
  """_summary_

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
        WEBSOCKET_MESSAGE_GREAT_STATE,
        WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_MESSAGE_FREE_ORDER,
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
        WEBSOCKET_MESSAGE_GREAT_STATE,
        WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_MESSAGE_FREE_ORDER,
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
    print(message)
    return ERROR_NO_MESSAGE_ID
  if not message.get(WEBSOCKET_MESSAGE_TYPE):
    return ERROR_NO_MESSAGE_TYPE
  if not message.get(WEBSOCKET_JAVASCRIPT_VERSION):
    return ERROR_NO_JAVASCRIPT_VERSION
  if not message[WEBSOCKET_JAVASCRIPT_VERSION] == JAVASCRIPT_VERSION:
    return ERROR_INVALID_JAVASCRIPT_VERSION
  return ""

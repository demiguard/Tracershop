from django.contrib.auth.models import AnonymousUser

from constants import *
from database.models import User, UserGroups


def AuthMessage(user : User, messageType : str) -> bool:
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
        WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
        WEBSOCKET_MESSAGE_UPDATEORDERS,]:
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
        WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
        WEBSOCKET_MESSAGE_UPDATEORDERS,]:
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

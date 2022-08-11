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
  if user.UserGroup == UserGroups.Production:
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
  if user.UserGroup == UserGroups.Ordering:
    if messageType in []:
      return True
    else:
      return False
  if user.UserGroup == UserGroups.OrderingNoRis:
    if messageType in []:
      return True
    else:
      return False
  return False

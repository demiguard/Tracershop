""""""

__author__ = "Christoffer"

# Python Standard Library
from email import message
from typing import Dict
from unittest import skip

# Third party packages
from django.test import SimpleTestCase
from django.contrib.auth.models import AnonymousUser

# Tracershop packages
from constants import ERROR_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_AUTH_LOGIN,\
  WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI,\
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION,\
  WEBSOCKET_MESSAGE_GET_ORDERS,\
  WEBSOCKET_MESSAGE_MOVE_ORDERS,  WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_JAVASCRIPT_VERSION, JAVASCRIPT_VERSION,\
  ERROR_INVALID_JAVASCRIPT_VERSION, WEBSOCKET_DATA, WEBSOCKET_DATA_ID,\
  DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD, ERROR_NO_MESSAGE_TYPE,\
  ERROR_NO_JAVASCRIPT_VERSION, ERROR_INVALID_AUTH, ERROR_INVALID_MESSAGE

from database.models import User, UserGroups
from lib.utils import LMAP

TEST_ADMIN_USERNAME = "admin"
TEST_ADMIN_PASSWORD = "password"

def createShellMessage(messageType : str) -> Dict:
  return {
    WEBSOCKET_MESSAGE_TYPE : messageType
  }

class AuthTestCase(SimpleTestCase):
  messages = LMAP(createShellMessage, [
    WEBSOCKET_MESSAGE_AUTH_LOGIN,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI,
    WEBSOCKET_MESSAGE_FREE_ACTIVITY,
    WEBSOCKET_MESSAGE_FREE_INJECTION,
    WEBSOCKET_MESSAGE_GET_ORDERS,
    WEBSOCKET_MESSAGE_MOVE_ORDERS,
  ])

  message_id = 6940269

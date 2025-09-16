""""""

__author__ = "Christoffer"

# Python Standard Library
from email import message
from typing import Dict
from unittest import skip

# Third party packages
from django.test import TransactionTestCase
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
from tracerauth.auth import AuthMessage, validateMessage, ValidateAuthObject


TEST_ADMIN_USERNAME = "admin"
TEST_ADMIN_PASSWORD = "password"


def createShellMessage(messageType : str) -> Dict:
  return {
    WEBSOCKET_MESSAGE_TYPE : messageType
  }

class authTestCase(TransactionTestCase):
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

  def test_validateMessage_validMessage(self):
    self.assertEqual(validateMessage({
      WEBSOCKET_MESSAGE_ID : 1337,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_ORDERS
    }),"")

  def test_validateMessage_FreeInjectionOrder(self):
    self.assertEqual(validateMessage(
      {
      WEBSOCKET_JAVASCRIPT_VERSION :  JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
      WEBSOCKET_DATA : {
        'lot_number' : "messageBatchNumber",
        WEBSOCKET_DATA_ID : 6631
      },
      DATA_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : TEST_ADMIN_PASSWORD
      }
    }
    ), "")

  def test_validate_empty_auth_object(self):
    with self.assertLogs(ERROR_LOGGER) as captured_logs:
      self.assertFalse(ValidateAuthObject({}))

    self.assertEqual(len(captured_logs.output), 2)
    self.assertRegex(captured_logs.output[0], "AUTH_USERNAME is missing")
    self.assertRegex(captured_logs.output[1], "AUTH_PASSWORD is missing")


  def test_validate_missing_message_type(self):
    self.assertEqual(validateMessage({
      WEBSOCKET_MESSAGE_ID : 167901
    }), ERROR_NO_MESSAGE_TYPE)

  def test_missing_javascript_type(self):
    self.assertEqual(validateMessage({
      WEBSOCKET_MESSAGE_ID : 69870235,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
    }), ERROR_NO_JAVASCRIPT_VERSION)

  def test_wrong_javascript_type(self):
    self.assertEqual(validateMessage({
      WEBSOCKET_MESSAGE_ID : 69870235,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_JAVASCRIPT_VERSION : "1.0.0"
    }), ERROR_INVALID_JAVASCRIPT_VERSION)

  def test_validateMessage_FreeInjectionOrder_Missing_AUTH(self):
    self.assertEqual(validateMessage(
      {
      WEBSOCKET_JAVASCRIPT_VERSION :  JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
      WEBSOCKET_DATA : {
        'lot_number' : "messageBatchNumber",
        WEBSOCKET_DATA_ID : 6631
      },
      DATA_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
      #  AUTH_PASSWORD : TEST_ADMIN_PASSWORD
      }
    }
    ), ERROR_INVALID_AUTH)

  def test_validateMessage_FreeInjectionOrder_Missing_DATA(self):
    self.assertEqual(validateMessage(
      {
      WEBSOCKET_JAVASCRIPT_VERSION :  JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
      #WEBSOCKET_DATA : {
      #  'lot_number' : "messageBatchNumber",
      #  WEBSOCKET_DATA_ID : 6631
      #},
      #DATA_AUTH : {
      #  AUTH_USERNAME : TEST_ADMIN_USERNAME,
      #  AUTH_PASSWORD : TEST_ADMIN_PASSWORD
      #}
    }
    ), ERROR_INVALID_MESSAGE)

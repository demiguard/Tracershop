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
from shared_constants import WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_AUTH_LOGIN,\
  WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI,\
  WEBSOCKET_MESSAGE_ECHO, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,\
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE,\
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION,\
  WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_MOVE_ORDERS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_JAVASCRIPT_VERSION, JAVASCRIPT_VERSION,\
  ERROR_INVALID_JAVASCRIPT_VERSION, WEBSOCKET_DATA, WEBSOCKET_DATA_ID,\
  DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD

from database.models import User, UserGroups
from lib.utils import LMAP
from tracerauth.auth import AuthMessage, validateMessage


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
    WEBSOCKET_MESSAGE_ECHO,
    WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
    WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
    WEBSOCKET_MESSAGE_EDIT_STATE,
    WEBSOCKET_MESSAGE_FREE_ACTIVITY,
    WEBSOCKET_MESSAGE_FREE_INJECTION,
    WEBSOCKET_MESSAGE_GET_ORDERS,
    WEBSOCKET_MESSAGE_MOVE_ORDERS,
  ])

  message_id = 6940269

  @skip
  def test_AuthMessage_anon(self):
    anon = AnonymousUser()
    responses = LMAP(lambda message : AuthMessage(anon, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 7)

  @skip
  def test_AuthMessage_admin(self):
    admin = User(username="admin", user_group=UserGroups.Admin)
    responses = LMAP(lambda message : AuthMessage(admin, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  # Due to the fact that these are not finished being implemented some of the tests are a bit scuffed
  # However once things gets implemented these tests needs to be updated

  @skip
  def test_AuthMessage_ProductionAdmin(self):
    ProductionAdmin = User(username="ProductionAdmin", user_group=UserGroups.ProductionAdmin)
    responses = LMAP(lambda message : AuthMessage(ProductionAdmin, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  @skip
  def test_AuthMessage_ProductionUser(self):
    ProductionUser = User(username="ProductionUser", user_group=UserGroups.ProductionUser)
    responses = LMAP(lambda message : AuthMessage(ProductionUser, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  @skip
  def test_AuthMessage_ShopAdmin(self):
    ShopAdmin = User(username="ShopAdmin", user_group=UserGroups.ShopAdmin)
    responses = LMAP(lambda message : AuthMessage(ShopAdmin, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 7)

  @skip
  def test_AuthMessage_ShopUser(self):
    ShopUser = User(username="ShopUser", user_group=UserGroups.ShopUser)
    responses = LMAP(lambda message : AuthMessage(ShopUser, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 7)

  @skip
  def test_AuthMessage_ShopExternal(self):
    ShopExternal = User(username="ShopExternal", user_group=UserGroups.ShopExternal)
    responses = LMAP(lambda message : AuthMessage(ShopExternal, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 7)


  def test_validateMessage_validMessage(self):
    self.assertEqual(validateMessage({
      WEBSOCKET_MESSAGE_ID : 1337,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO
    }),"")

  def test_validateMessage_RealCase_1(self):
    self.assertEqual(validateMessage(
      {'messageType': 'whoami',
      'messageID': 900288973,
      'javascriptVersion': '1.0.0'}), ERROR_INVALID_JAVASCRIPT_VERSION
    )

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

from django.test import TestCase
from django.contrib.auth.models import AnonymousUser

from database.models import User, UserGroups
from tracerauth.auth import AuthMessage
from lib.utils import LMAP


from constants import *

# Create your tests here.
class authTestCase(TestCase):
  messages = [
    WEBSOCKET_MESSAGE_AUTH_LOGIN,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI,
    WEBSOCKET_MESSAGE_ECHO,
    WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
    WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
    WEBSOCKET_MESSAGE_EDIT_STATE,
    WEBSOCKET_MESSAGE_FREE_ORDER,
    WEBSOCKET_MESSAGE_GET_ORDERS,
    WEBSOCKET_MESSAGE_GREAT_STATE,
    WEBSOCKET_MESSAGE_MOVE_ORDERS,
    WEBSOCKET_MESSAGE_UPDATEORDERS,
  ]

  def test_AuthMessage_anon(self):
    anon = AnonymousUser()
    responses = LMAP(lambda message : AuthMessage(anon, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 8)

  def test_AuthMessage_admin(self):
    admin = User(username="admin", UserGroup=UserGroups.Admin, OldTracerBaseID=1)
    responses = LMAP(lambda message : AuthMessage(admin, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  # Due to the fact that these are not finished being implemented some of the tests are a bit scuffed
  # However once things gets implemented these tests needs to be updated

  def test_AuthMessage_ProductionAdmin(self):
    ProductionAdmin = User(username="ProductionAdmin", UserGroup=UserGroups.ProductionAdmin, OldTracerBaseID=2)
    responses = LMAP(lambda message : AuthMessage(ProductionAdmin, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  def test_AuthMessage_ProductionUser(self):
    ProductionUser = User(username="ProductionUser", UserGroup=UserGroups.ProductionUser, OldTracerBaseID=3)
    responses = LMAP(lambda message : AuthMessage(ProductionUser, message), self.messages)
    self.assertListEqual(responses, [True] * len(responses))

  def test_AuthMessage_ShopAdmin(self):
    ShopAdmin = User(username="ShopAdmin", UserGroup=UserGroups.ShopAdmin, OldTracerBaseID=4)
    responses = LMAP(lambda message : AuthMessage(ShopAdmin, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 8)

  def test_AuthMessage_ShopUser(self):
    ShopUser = User(username="ShopUser", UserGroup=UserGroups.ShopUser, OldTracerBaseID=5)
    responses = LMAP(lambda message : AuthMessage(ShopUser, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 8)

  def test_AuthMessage_ShopExternal(self):
    ShopExternal = User(username="ShopExternal", UserGroup=UserGroups.ShopExternal, OldTracerBaseID=6)
    responses = LMAP(lambda message : AuthMessage(ShopExternal, message), self.messages)
    self.assertListEqual(responses, [True] * 4 + [False] * 8)
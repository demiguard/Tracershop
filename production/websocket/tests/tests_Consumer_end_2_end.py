""" These test are the end-to-end tests for the websocket

This means that this is an indirect test of:
    * DatabaseInterface
    * SQLController
    * SQLFactory
    * SQLExecuter
    * ProductionDataclasses
    * ProductionJSON
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from asyncio.exceptions import TimeoutError
import datetime
from json import loads
from logging import ERROR
from pprint import pprint
import time
from typing import Any, Dict
from unittest import skip

# Third party packages
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.routing import URLRouter, ProtocolTypeRouter
from channels.layers import get_channel_layer
from channels.sessions import SessionMiddlewareStack
from channels.testing import WebsocketCommunicator
from django.core import serializers
from django.core.asgi import get_asgi_application
from django.urls import re_path
from django.test import TestCase, TransactionTestCase, override_settings

# Tracershop Production
from core.side_effect_injection import DateTimeNow
from constants import *
from database.database_interface import DatabaseInterface
from database.models import Address, ClosedDate, Database, ServerConfiguration, User, UserGroups, MODELS
from websocket.Consumer import Consumer

# Asgi Loading
django_asgi_app = get_asgi_application()

from websocket import routing # Import that this line is here, otherwise load order is fucked up
#

app = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : SessionMiddlewareStack(AuthMiddlewareStack(
    URLRouter([re_path(r'ws/$', Consumer.as_asgi())]))
  )
})


class FakeDatetime(DateTimeNow):
  def now(self):
    return datetime.datetime(2012,10,11,11,22,33) # pragma: no cover

TEST_ADMIN_USERNAME = "admin_username"
TEST_ADMIN_PASSWORD = "admin_password"


#NOTE: that sadly the connection cannot be in a setup case,
# due to it being in different event loop
class ConsumerTestCase(TransactionTestCase):
  message_id = 6942069

  SQL = DatabaseInterface()

  loginAdminMessage = message = {
      JSON_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : TEST_ADMIN_PASSWORD
      },
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message_id
    }

  InjectionOrderStatus2OID = 6631

  async def _sendReceive(self, comm: WebsocketCommunicator, message: Dict[str, Any]):
    await comm.send_json_to(message)
    return await comm.receive_json_from()

  async def _loginAdminSendRecieve(self, message : Dict):
    comm = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm.connect()
    _login_response = await self._sendReceive(comm, self.loginAdminMessage)
    response = await self._sendReceive(comm, message)

    await comm.disconnect()
    return response

  def setUp(self):
    pass
    self.user = User(username=TEST_ADMIN_USERNAME, UserGroup=UserGroups.Admin)
    self.user.set_password(TEST_ADMIN_PASSWORD)
    self.user.save()

  def tearDown(self):
    pass

  #Universal Messages
  async def test_connect_to_consumer(self):
      comm = WebsocketCommunicator(app,"ws/")
      conn, subprotocal = await comm.connect()
      self.assertTrue(conn)
      await comm.disconnect()

  async def test_echo(self):
    comm = WebsocketCommunicator(app,"ws/")
    conn, subprotocal = await comm.connect()
    response = await self._sendReceive(comm, {
          WEBSOCKET_MESSAGE_ID : self.message_id,
          WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO
      })

    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)
    self.assertEqual(response[WEBSOCKET_MESSAGE_TYPE], WEBSOCKET_MESSAGE_ECHO)


  ##### Auth #####

  async def test_login_persists(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, _subprotocol = await comm.connect()


    response = await self._sendReceive(comm, self.loginAdminMessage)
    sessionID = response['sessionid']
    await comm.disconnect()

    sessionCookie = "sessionid=" + sessionID

    recomm = WebsocketCommunicator(app, "ws/", headers=[("cookie".encode(), sessionCookie.encode())])
    _conn, _subprotocol = await recomm.connect()

    whoAmI_reponse = await self._sendReceive(recomm, {
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
        WEBSOCKET_MESSAGE_ID : self.message_id,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    await recomm.disconnect()

    self.assertTrue(whoAmI_reponse[AUTH_IS_AUTHENTICATED])
    self.assertEqual(whoAmI_reponse[AUTH_USERNAME], TEST_ADMIN_USERNAME)
    self.assertEqual(whoAmI_reponse[LEGACY_KEYWORD_USERGROUP], 1)


  async def test_login_logout_whoamI(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, subprotocol = await comm.connect()

    loginMessage = await self._sendReceive(comm, self.loginAdminMessage)
    logoutMessage = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    whoAmIMessage = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })

    self.assertFalse(whoAmIMessage[AUTH_IS_AUTHENTICATED])
    self.assertEqual(whoAmIMessage[AUTH_USERNAME], "")
    self.assertEqual(whoAmIMessage[LEGACY_KEYWORD_USERGROUP], 0)


  async def test_login_wrong_password(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, subprotocol = await comm.connect()

    response = await self._sendReceive(comm, {
      JSON_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : "Not_ADMIN_password"
      },
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,

    })

    self.assertFalse(response[AUTH_IS_AUTHENTICATED])
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_SUCCESS)

    whoAmIMessage = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })

    self.assertFalse(whoAmIMessage[AUTH_IS_AUTHENTICATED])
    self.assertEqual(whoAmIMessage[AUTH_USERNAME], "")
    self.assertEqual(whoAmIMessage[LEGACY_KEYWORD_USERGROUP], 0)


  ##### Error handling #####
  # These Test showcase how the Consumer handles messages, that are invalid in some form or another
  async def test_invalidated_Message(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {})
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_NO_MESSAGE_ID)

    await comm.disconnect()

  async def test_insufficientPermissions(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INSUFFICIENT_PERMISSIONS)

    await comm.disconnect()


  async def test_InvalidMessageType(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : "Not a message type!",

    })
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INVALID_MESSAGE_TYPE)

    await comm.disconnect()

  async def test_InvalidJavascript(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : '1.0.0',
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,

    })
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INVALID_JAVASCRIPT_VERSION)

    await comm.disconnect()

  ##### Message Testing #####
  async def test_GetState(self):
    response = await self._loginAdminSendRecieve({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    self.assertEqual(self.message_id, response[WEBSOCKET_MESSAGE_ID])


  #
  async def test_ModelCreate_ClosedDate(self):
    keyword = JSON_CLOSED_DATE
    Model = MODELS[keyword]

    comm = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm.connect()
    #_login_response = await self._sendReceive(comm, self.loginAdminMessage)
    await comm.send_json_to(self.loginAdminMessage)
    _login_response = await comm.receive_json_from()


    await comm.send_json_to({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_CREATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_DATATYPE : keyword,
      WEBSOCKET_DATA : {
        "close_date" : "2021-11-30"
      }
    })

    response = await comm.receive_json_from()
    await comm.disconnect()
    closedDate: ClosedDate = await database_sync_to_async(ClosedDate.objects.get)(close_date=datetime.date(2021,11,30))

    self.assertIn(WEBSOCKET_DATA, response)
    data = response[WEBSOCKET_DATA]
    self.assertIn(keyword, data)
    models = data[keyword]




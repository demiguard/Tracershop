""" These test are the end-to-end tests for the websocket

This means that this is an indirect test of:
    * DatabaseInterface
    * SQLController
    * SQLFactory
    * SQLExecuter
    * ProductionDataclasses
    * ProductionJSON
"""
from unittest import skip
from channels.auth import AuthMiddlewareStack
from channels.routing import URLRouter, ProtocolTypeRouter
from channels.sessions import SessionMiddlewareStack
from channels.testing import WebsocketCommunicator

from django.core import serializers
from django.core.asgi import get_asgi_application
from django.urls import re_path
from django.test import TestCase

import datetime
from json import loads
from pprint import pprint
from typing import Dict
import time

from database.models import Address, Database, ServerConfiguration, User, UserGroups
from constants import *
from lib.SQL.SQLExecuter import Fetching
from lib.SQL import SQLFactory
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerDataClass, VialDataClass
from lib.utils import LFILTER
from tests.helpers import cleanTable, getModel, async_ExecuteQuery, TEST_ADMIN_USERNAME, TEST_ADMIN_PASSWORD
from tests.test_DataClasses import TEST_DATA_DICT, useDataClassAsync # This file standizes the dataclasses
from websocket.DatabaseInterface import DatabaseInterface
from websocket.Consumer import Consumer

django_asgi_app = get_asgi_application()

from websocket import routing # Import that this line is here, otherwise load order is fucked up

app = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : SessionMiddlewareStack(AuthMiddlewareStack(
    URLRouter([re_path(r'ws/$', Consumer.as_asgi())]))
  )
})

class FakeDatetime(datetime.datetime):
  @classmethod
  def now(cls):
    return datetime.datetime(2012,10,11,11,22,33)


#NOTE: that sadly the connection cannot be in a setup case,
# due to it being in different event loop
class ConsumerTestCase(TestCase):
  message_id = 6942069

  loginAdminMessage = message = {
      JSON_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : TEST_ADMIN_PASSWORD
      },
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message_id
    }

  activityOrderStatus2Str = SQLFactory.tupleInsertQuery(
    [ ("deliver_datetime","2022-10-11 11:30:00"),
      ("oid", 1337),
      ("status", 2),
      ("amount", 10000),
      ("amount_o", 12000),
      ("total_amount", 10000),
      ("total_amount_o", 12000),
      ("tracer", 1),
      ("run", 2),
      ("BID", 1),
      ("batchnr", ""),
      ("COID", -1),
    ], "orders"
  )

  activityOrderDependant = SQLFactory.tupleInsertQuery(
    [ ("deliver_datetime","2022-10-11 11:30:00"),
      ("oid", 1338),
      ("status", 2),
      ("amount", 10000),
      ("amount_o", 12000),
      ("total_amount", 0),
      ("total_amount_o", 0),
      ("tracer", 1),
      ("run", 2),
      ("BID", 1),
      ("batchnr", ""),
      ("COID", 1337),
    ], "orders"
  )

  vialStr = SQLFactory.tupleInsertQuery([
    ("customer", 1),
    ("charge", "Test_CE2E_1"),
    ("filldate", "2022-10-11"),
    ("filltime", "11:27:11"),
    ("volume", 8.91),
    ("activity", 12942),
    ("ID", 62104)
  ], "VAL")

  async def _sendReceive(self, comm : WebsocketCommunicator,   message : Dict):
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
    self.startTime = time.time()

  def tearDown(self):
    cleanTable("oid", "orders", self._testMethodName)
    t = time.time() - self.startTime
    #print('%s: %.3f' % (self.id(), t))

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

  @useDataClassAsync(ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass,
      IsotopeDataClass, InjectionOrderDataClass, RunsDataClass, TracerDataClass,
      VialDataClass)
  async def test_GreatState(self):
    response = await self._loginAdminSendRecieve({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GREAT_STATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    self.assertEqual(self.message_id, response[WEBSOCKET_MESSAGE_ID])
    #Validate
    GreatState = response[JSON_GREAT_STATE]
    # Decoding
    address = [model.object for model in serializers.deserialize("json", GreatState[JSON_ADDRESS])]
    database = [model.object for model in serializers.deserialize("json", GreatState[JSON_DATABASE])]
    serverConfigMessage = [model.object for model in serializers.deserialize("json", GreatState[JSON_SERVER_CONFIG])]
    #Legacy
    #Dataclasses are double encoded.
    Customers = [CustomerDataClass(**loads(loads(customerJson))) for customerJson in GreatState[JSON_CUSTOMER]]
    DeliverTimes = [DeliverTimeDataClass(**loads(loads(deliverTimeJson))) for deliverTimeJson in GreatState[JSON_DELIVERTIME]]
    Isotopes = [IsotopeDataClass(**loads(loads(isotopeJson))) for isotopeJson in GreatState[JSON_ISOTOPE]]
    Runs = [RunsDataClass(**loads(loads(runsJson))) for runsJson in GreatState[JSON_RUN]]
    Tracers = [TracerDataClass(**loads(loads(tracerJson))) for tracerJson in GreatState[JSON_TRACER]]
    Orders = [ActivityOrderDataClass(**loads(loads(actorder))) for actorder in GreatState[JSON_ACTIVITY_ORDER]]
    TOrders = [InjectionOrderDataClass(**loads(loads(injOrder))) for injOrder in GreatState[JSON_INJECTION_ORDER]]
    Vials = [VialDataClass(**loads(loads(vial))) for vial in GreatState[JSON_VIAL]]


    serverConfig = await getModel(ServerConfiguration, 1)
    now = datetime.datetime.now()
    today = datetime.date.today()
    startTime = now - datetime.timedelta(days=serverConfig.DateRange)
    startDate = today - datetime.timedelta(days=serverConfig.DateRange)
    endtime = now + datetime.timedelta(days=serverConfig.DateRange)
    endDate = today + datetime.timedelta(days=serverConfig.DateRange)
    # Validation
    self.assertListEqual(address, [await getModel(Address, 1)])
    self.assertListEqual(database, [await getModel(Database, "test_tracershop")])
    self.assertListEqual(serverConfigMessage, [serverConfig])

    self.assertListEqual(Customers, TEST_DATA_DICT[CustomerDataClass])
    self.assertListEqual(DeliverTimes, TEST_DATA_DICT[DeliverTimeDataClass])
    self.assertListEqual(Isotopes, TEST_DATA_DICT[IsotopeDataClass])
    self.assertListEqual(Runs, TEST_DATA_DICT[RunsDataClass])
    self.assertListEqual(Tracers, TEST_DATA_DICT[TracerDataClass])

    # Date Sensitive information
    correctActivityOrders = LFILTER(
      lambda order: startTime < order.deliver_datetime and
         order.deliver_datetime < endtime, TEST_DATA_DICT[ActivityOrderDataClass])
    self.assertListEqual(Orders, correctActivityOrders)

    correctInjectionOrders = LFILTER(
      lambda order: startTime < order.deliver_datetime and
         order.deliver_datetime < endtime, TEST_DATA_DICT[InjectionOrderDataClass])
    self.assertListEqual(TOrders, correctInjectionOrders)

    correctVials = LFILTER(lambda order: startDate < order.filldate and
         order.filldate < endDate, TEST_DATA_DICT[VialDataClass])
    self.assertListEqual(Vials, correctVials)

    ##### Auth #####
  async def test_login_persists(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, _subprotocal = await comm.connect()

    response = await self._sendReceive(comm, self.loginAdminMessage)
    sessionID = response['sessionid']
    await comm.disconnect()

    sessionCookie = "sessionid=" + sessionID

    recomm = WebsocketCommunicator(app, "ws/", headers=[("cookie".encode(), sessionCookie.encode())])
    _conn, _subprotocal = await recomm.connect()

    whoAmI_reponse = await self._sendReceive(recomm, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    await recomm.disconnect()

    self.assertTrue(whoAmI_reponse[AUTH_IS_AUTHENTICATED])
    self.assertEqual(whoAmI_reponse[AUTH_USERNAME], TEST_ADMIN_USERNAME)
    self.assertEqual(whoAmI_reponse[KEYWORD_USERGROUP], 1)

  async def test_login_logout_whoamI(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

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
    self.assertEqual(whoAmIMessage[KEYWORD_USERGROUP], 0)

  ##### Create Dataclass #####
  @useDataClassAsync(VialDataClass) # Added these to avoid an empty Vial database
  async def test_createVial(self):
    # Test
    response = await self._loginAdminSendRecieve({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_DATATYPE : JSON_VIAL,
      WEBSOCKET_DATA : {
        KEYWORD_CUSTOMER : 1,
        KEYWORD_CHARGE : "Test Charge",
        KEYWORD_FILLDATE : "2022-08-01",
        KEYWORD_FILLTIME : "06:32:11",
        KEYWORD_VOLUME : 13.37,
        KEYWORD_ACTIVITY : 13337
      }
    })
    # Get side effects
    JsonVial = loads(loads(response[WEBSOCKET_DATA]))
    Vial = await async_ExecuteQuery(f"SELECT {VialDataClass.getSQLFields()} FROM VAL WHERE ID={JsonVial[KEYWORD_ID]}", Fetching.ONE)

    ResponseVial = VialDataClass.fromDict(JsonVial)
    DatabaseVial = VialDataClass(**Vial)

    # Asserting
    self.assertEqual(ResponseVial, DatabaseVial)
    self.assertEqual(response[WEBSOCKET_DATATYPE], JSON_VIAL)
    self.assertEqual(response[WEBSOCKET_DATA_ID], "ID")
    self.assertEqual(response[WEBSOCKET_MESSAGE_TYPE],WEBSOCKET_MESSAGE_CREATE_DATA_CLASS)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)

    #Clean up
    await async_ExecuteQuery(f"DELETE FROM VAL WHERE ID={JsonVial[KEYWORD_ID]}", Fetching.NONE)


  ##### Free Order ####
  @useDataClassAsync(CustomerDataClass, TracerDataClass, IsotopeDataClass, VialDataClass)
  async def test_free_order(self):
    await async_ExecuteQuery(self.activityOrderStatus2Str, Fetching.NONE)
    await async_ExecuteQuery(self.vialStr, Fetching.NONE)

    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()
    login_message = await self._sendReceive(comm, self.loginAdminMessage)

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_DATA : {
        JSON_ACTIVITY_ORDER : 1337,
        JSON_VIAL : [62104]
      }
    })

    Vial = VialDataClass(**await async_ExecuteQuery(f"SELECT {VialDataClass.getSQLFields()} FROM VAL WHERE ID=62104", Fetching.ONE))
    Order = ActivityOrderDataClass(**await async_ExecuteQuery(f"SELECT {ActivityOrderDataClass.getSQLFields()} FROM orders WHERE oid=1337", Fetching.ONE))

    responseVial = VialDataClass(**loads(response[JSON_VIAL][0]))
    try:
      responseOrder = ActivityOrderDataClass(**loads(response[JSON_ACTIVITY_ORDER][0]))
    except Exception as E:
      print(E)
      print(response[JSON_ACTIVITY_ORDER][0])

    #Message Validation
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_SUCCESS)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)
    self.assertEqual(len(response[JSON_ACTIVITY_ORDER]),1)
    self.assertEqual(len(response[JSON_VIAL]),1)
    #Vial Validation
    self.assertEqual(Vial.order_id, 1337)
    #Order Validation
    self.assertEqual(Order.status, 3)
    self.assertEqual(Order.batchnr, Vial.charge)
    self.assertEqual(Order.frigivet_amount, Vial.activity)
    self.assertEqual(Order.volume, Vial.volume)

    # Cleanup
    await async_ExecuteQuery(f"DELETE FROM VAL WHERE ID=62104", Fetching.NONE)
    await async_ExecuteQuery(f"DELETE FROM orders WHERE oid=1337", Fetching.NONE)

  @useDataClassAsync(CustomerDataClass, TracerDataClass, IsotopeDataClass, VialDataClass)
  async def test_free_dependant_orders(self):
    await async_ExecuteQuery(self.activityOrderStatus2Str, Fetching.NONE)
    await async_ExecuteQuery(self.activityOrderDependant, Fetching.NONE)
    await async_ExecuteQuery(self.vialStr, Fetching.NONE)

    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()
    login_message = await self._sendReceive(comm, self.loginAdminMessage)

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_DATA : {
        JSON_ACTIVITY_ORDER : 1337,
        JSON_VIAL : [62104]
      }
    })

    Vial = VialDataClass(**await async_ExecuteQuery(f"SELECT {VialDataClass.getSQLFields()} FROM VAL WHERE ID=62104", Fetching.ONE))
    Order = ActivityOrderDataClass(**await async_ExecuteQuery(f"SELECT {ActivityOrderDataClass.getSQLFields()} FROM orders WHERE oid=1337", Fetching.ONE))
    DependantOrder = ActivityOrderDataClass(**await async_ExecuteQuery(f"SELECT {ActivityOrderDataClass.getSQLFields()} FROM orders WHERE oid=1338", Fetching.ONE))

    #Message Validation
    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_SUCCESS)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)
    self.assertEqual(len(response[JSON_ACTIVITY_ORDER]),2)
    self.assertEqual(len(response[JSON_VIAL]),1)
    #Vial Validation
    self.assertEqual(Vial.order_id, 1337)
    #Order Validation
    self.assertEqual(Order.status, 3)
    self.assertEqual(Order.batchnr, Vial.charge)
    self.assertEqual(Order.frigivet_amount, Vial.activity)
    self.assertEqual(Order.volume, Vial.volume)



    # Cleanup
    await async_ExecuteQuery(f"DELETE FROM VAL WHERE ID=62104", Fetching.NONE)
    await async_ExecuteQuery(f"DELETE FROM orders WHERE oid=1337", Fetching.NONE)
    await async_ExecuteQuery(f"DELETE FROM orders WHERE oid=1338", Fetching.NONE)
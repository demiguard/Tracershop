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
from channels.layers import get_channel_layer, InMemoryChannelLayer
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
from database.models import Address, ClosedDate, Database, ServerConfiguration,\
    User, UserGroups, MODELS, ActivityDeliveryTimeSlot, Customer, DeliveryEndpoint,\
    Tracer, ActivityProduction, Isotope, ActivityOrder, Vial, InjectionOrder
from websocket.consumer import Consumer

# Testing library
from tests.helpers import InitializeTestDatabase


# Asgi Loading
django_asgi_app = get_asgi_application()

from websocket import routing # Import that this line is here, otherwise load order is fucked up
class FakeDatetime(DateTimeNow):
  def now(self):
    return datetime.datetime(2012,10,11,11,22,33, tzinfo=datetime.timezone(offset=datetime.timedelta(seconds=60*60), name="Europa/Copenhagen")) # pragma: no cover

app = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : SessionMiddlewareStack(AuthMiddlewareStack(
    URLRouter([re_path(r'ws/$', Consumer.as_asgi(datetimeNow=FakeDatetime()))]))
  )
})



TEST_ADMIN_USERNAME = "admin_username"
TEST_ADMIN_PASSWORD = "admin_password"


#NOTE: that sadly the connection cannot be in a setup case,
# due to it being in different event loop
class ConsumerTestCase(TransactionTestCase):
  message_id = 6942069

  SQL = DatabaseInterface()

  loginAdminMessage = {
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
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
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
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm = WebsocketCommunicator(app,"ws/")
      conn, subprotocal = await comm.connect()
      response = await self._sendReceive(comm, {
          WEBSOCKET_MESSAGE_ID : self.message_id,
          WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO
      })
      await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)
    self.assertEqual(response[WEBSOCKET_MESSAGE_TYPE], WEBSOCKET_MESSAGE_ECHO)


  ##### Auth #####

  async def test_login_persists(self):
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
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
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
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
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
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

      await comm.disconnect()

    self.assertFalse(whoAmIMessage[AUTH_IS_AUTHENTICATED])
    self.assertEqual(whoAmIMessage[AUTH_USERNAME], "")
    self.assertEqual(whoAmIMessage[LEGACY_KEYWORD_USERGROUP], 0)


  ##### Error handling #####
  # These Test showcase how the Consumer handles messages, that are invalid in some form or another
  async def test_invalidated_Message(self):
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm = WebsocketCommunicator(app, "ws/", headers=b'')
      _conn, subprotocal = await comm.connect()

      response = await self._sendReceive(comm, {})
      await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_NO_MESSAGE_ID)


  async def test_insufficientPermissions(self):
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm = WebsocketCommunicator(app, "ws/", headers=b'')
      _conn, subprotocal = await comm.connect()

      response = await self._sendReceive(comm, {
        WEBSOCKET_MESSAGE_ID : self.message_id,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INSUFFICIENT_PERMISSIONS)


  async def test_InvalidMessageType(self):
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm = WebsocketCommunicator(app, "ws/", headers=b'')
      _conn, subprotocal = await comm.connect()

      response = await self._sendReceive(comm, {
        WEBSOCKET_MESSAGE_ID : self.message_id,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
        WEBSOCKET_MESSAGE_TYPE : "Not a message type!",
      })
      await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INVALID_MESSAGE_TYPE)


  async def test_InvalidJavascript(self):
    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm = WebsocketCommunicator(app, "ws/", headers=b'')
      _conn, subprotocal = await comm.connect()

      response = await self._sendReceive(comm, {
        WEBSOCKET_MESSAGE_ID : self.message_id,
        WEBSOCKET_JAVASCRIPT_VERSION : '1.0.0',
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,
      })
      await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], ERROR_INVALID_JAVASCRIPT_VERSION)


  ##### Message Testing #####
  async def test_GetState(self):
    response = await self._loginAdminSendRecieve({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    self.assertEqual(self.message_id, response[WEBSOCKET_MESSAGE_ID])


  async def test_ModelCreate_ClosedDate(self):
    keyword = JSON_CLOSED_DATE
    Model = MODELS[keyword]

    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):

      comm = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm.connect()

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


    modelBackend: ClosedDate = await database_sync_to_async(Model.objects.get)(close_date=datetime.date(2021,11,30))
    self.assertIn(WEBSOCKET_DATA, response)
    data = response[WEBSOCKET_DATA]
    self.assertIn(keyword, data)
    jsonParsed = loads(data)
    modelFrontend = await database_sync_to_async(Model.objects.get)(pk=jsonParsed[keyword][0]['pk'])
    self.assertEqual(modelFrontend, modelBackend)

    await comm.disconnect()

  async def test_createActivityOrder(self):
    """I am really not sure how this works"""
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    timeSlot= ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production
    )
    await database_sync_to_async(timeSlot.save)()

    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_ACTIVITY_ORDER,
        WEBSOCKET_MESSAGE_ID : 6823494122,
        WEBSOCKET_DATA : {
          'ordered_activity' : 15892,
          'delivery_date' : '2020-05-03',
          'comment' : None,
          'ordered_time_slot' : 7,
          'moved_to_time_slot' : None,

        }
      })
      admin_message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()
    # Assert


  async def test_createInjectionOrder(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      tracer_id=3,
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=2,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()


    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_INJECTION_ORDER,
        WEBSOCKET_MESSAGE_ID : 6823494122,
        WEBSOCKET_DATA : {
          'delivery_time' : "10:30:00",
          'delivery_date' : '2020-05-03',
          'comment' : None,
          'injections' : 3,
          'tracer_usage' : 0,
          'endpoint' : 67,
          'tracer' : 3
        }
      })
      admin_message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()
    # Assert

  async def test_moveOrders(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production_1 = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production_1.save)()

    production_2 = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "12:00:00",
    )
    await database_sync_to_async(production_2.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    timeSlot_1 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production_1
    )
    await database_sync_to_async(timeSlot_1.save)()

    timeSlot_2 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 8,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production_2
    )
    await database_sync_to_async(timeSlot_2.save)()


    order = ActivityOrder(
      activity_order_id = 36,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=1,
      comment=None,
      ordered_time_slot=timeSlot_2,
    )

    await database_sync_to_async(order.save)()

    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_ACTIVITY_ORDER : [36],
        JSON_DELIVER_TIME : 7,
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MOVE_ORDERS,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })

      returnMessage = await comm_admin.receive_json_from()
      await comm_admin.disconnect()

    await database_sync_to_async(order.refresh_from_db)()

    timeSlot: ActivityDeliveryTimeSlot = await database_sync_to_async(order.__getitem__)('moved_to_time_slot')
    self.assertEqual(timeSlot.activity_delivery_time_slot_id, 7)

  async def test_RestoreOrder(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production_1 = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production_1.save)()

    production_2 = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "12:00:00",
    )
    await database_sync_to_async(production_2.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    timeSlot_1 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production_1
    )
    await database_sync_to_async(timeSlot_1.save)()

    timeSlot_2 = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 8,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production_2
    )
    await database_sync_to_async(timeSlot_2.save)()


    order = ActivityOrder(
      activity_order_id = 36,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=1,
      comment=None,
      ordered_time_slot=timeSlot_2,
      moved_to_time_slot=timeSlot_1,
    )

    await database_sync_to_async(order.save)()

    channel_layers_setting = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS=channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_ACTIVITY_ORDER : [36],
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_RESTORE_ORDERS,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      message = await comm_admin.receive_json_from()

      await comm_admin.disconnect()

    await database_sync_to_async(order.refresh_from_db)()
    self.assertIsNone(order.moved_to_time_slot)

  async def test_freeActivityOrder(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    timeSlot = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production
    )
    await database_sync_to_async(timeSlot.save)()

    order = ActivityOrder(
      activity_order_id = 36,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=2,
      comment=None,
      ordered_time_slot=timeSlot,
    )
    await database_sync_to_async(order.save)()

    vial = Vial(
      vial_id=15934,
      tracer=tracer,
      activity=48812,
      volume=13.82,
      lot_number="Test-200611-1",
      fill_time="11:33:55",
      fill_date="2020-06-11",
      assigned_to=None,
      owner=customer,
    )
    await database_sync_to_async(vial.save)()

    channel_layers_setting = {
      "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_AUTH : {
          AUTH_USERNAME : TEST_ADMIN_USERNAME,
          AUTH_PASSWORD : TEST_ADMIN_PASSWORD,
        },
        WEBSOCKET_DATA : {
          JSON_VIAL : [15934],
          JSON_DELIVER_TIME : 7,
          JSON_ACTIVITY_ORDER : [36],
        },
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()

  async def test_freeActivityOrder_rejected(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    timeSlot = ActivityDeliveryTimeSlot(
      activity_delivery_time_slot_id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=endpoint,
      production_run=production
    )
    await database_sync_to_async(timeSlot.save)()

    order = ActivityOrder(
      activity_order_id = 36,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=2,
      comment=None,
      ordered_time_slot=timeSlot,
    )
    await database_sync_to_async(order.save)()

    vial = Vial(
      vial_id=15934,
      tracer=tracer,
      activity=48812,
      volume=13.82,
      lot_number="Test-200611-1",
      fill_time="11:33:55",
      fill_date="2020-06-11",
      assigned_to=None,
      owner=customer,
    )
    await database_sync_to_async(vial.save)()

    channel_layers_setting = {
      "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_AUTH : {
          AUTH_USERNAME : TEST_ADMIN_USERNAME,
          AUTH_PASSWORD : "NOT ADMIN PASSWORD",
        },
        WEBSOCKET_DATA : {
          JSON_VIAL : [15934],
          JSON_DELIVER_TIME : 7,
          JSON_ACTIVITY_ORDER : [36],
        },
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()

    self.assertFalse(message[AUTH_IS_AUTHENTICATED])
    await database_sync_to_async(order.refresh_from_db)()
    self.assertEqual(order.status, 2)


  async def test_freeInjectionOrder(self):
    isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )
    await database_sync_to_async(isotope.save)()

    tracer = Tracer(
      isotope=isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    await database_sync_to_async(tracer.save)()

    production = ActivityProduction(
      tracer=tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    await database_sync_to_async(production.save)()

    customer = Customer(
      customer_id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer.save)()
    endpoint = DeliveryEndpoint(
      tracer_endpoint_id = 67,
      owner = customer,
      name="endpoint",
    )
    await database_sync_to_async(endpoint.save)()

    order = InjectionOrder(
      injection_order_id = 481,
      delivery_time="09:07:45",
      delivery_date="2020-06-11",
      injections=1,
      status=2,
      tracer_usage=1,
      comment=None,
      endpoint=endpoint,
      tracer=tracer,
      lot_number=None,
      freed_datetime=None,
      freed_by=None,
    )

    await database_sync_to_async(order.save)()

    channel_layers_setting = {
      "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_AUTH : {
          AUTH_USERNAME : TEST_ADMIN_USERNAME,
          AUTH_PASSWORD : TEST_ADMIN_PASSWORD,
        },
        WEBSOCKET_DATA : {
          WEBSOCKET_DATA_ID : 481,
          "lot_number" : "gfh-200611-1",
        },
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()

  async def test_freeInjectionOrder_rejected(self):
    channel_layers_setting = {
      "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

    with override_settings(CHANNEL_LAYERS = channel_layers_setting):
      comm_admin = WebsocketCommunicator(app,"ws/")
      _conn, _subprotocal = await comm_admin.connect()

      await comm_admin.send_json_to(self.loginAdminMessage)
      admin_login_message = await comm_admin.receive_json_from()

      await comm_admin.send_json_to({
        JSON_AUTH : {
          AUTH_USERNAME : TEST_ADMIN_USERNAME,
          AUTH_PASSWORD : "NOT ADMIN PASSWORD",
        },
        WEBSOCKET_DATA : {
          WEBSOCKET_DATA_ID : 481,
          "lot_number" : "gfh-200611-1",
        },
        WEBSOCKET_MESSAGE_ID : 69230481,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
        WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      })
      message = await comm_admin.receive_json_from()
      await comm_admin.disconnect()

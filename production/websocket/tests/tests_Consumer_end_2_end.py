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
from unittest import skip, mock

# Third party packages
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.routing import URLRouter, ProtocolTypeRouter
from channels.layers import get_channel_layer, InMemoryChannelLayer
from channels.sessions import SessionMiddlewareStack
from channels.testing import WebsocketCommunicator
from django.core import serializers
from django.core.asgi import get_asgi_application
from django.core.exceptions import ObjectDoesNotExist
from django.urls import re_path
from django.test import TestCase, TransactionTestCase, override_settings


# Tracershop Production
from core.side_effect_injection import DateTimeNow
from shared_constants import DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD,\
  WEBSOCKET_JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_ID,\
  JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_AUTH_LOGIN, WEBSOCKET_MESSAGE_ECHO,\
  WEBSOCKET_MESSAGE_AUTH_WHOAMI, AUTH_IS_AUTHENTICATED, WEBSOCKET_MESSAGE_AUTH_LOGOUT,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_SUCCESS, ERROR_NO_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_GET_STATE, ERROR_INSUFFICIENT_PERMISSIONS, ERROR_INVALID_MESSAGE_TYPE,\
  ERROR_INVALID_JAVASCRIPT_VERSION, DATA_CLOSED_DATE, WEBSOCKET_MESSAGE_CREATE_ACTIVITY_ORDER,\
  WEBSOCKET_DATA, WEBSOCKET_MESSAGE_CREATE_INJECTION_ORDER, DATA_ACTIVITY_ORDER,\
  DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_MOVE_ORDERS, DATA_CUSTOMER, WEBSOCKET_MESSAGE_MODEL_DELETE,\
  WEBSOCKET_MESSAGE_RESTORE_ORDERS, WEBSOCKET_MESSAGE_MODEL_CREATE, DATA_VIAL,\
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_MESSAGE_ERROR,\
  ERROR_TYPE, AUTH_USER

from database.database_interface import DatabaseInterface
from database.models import ClosedDate, User, UserGroups, MODELS,\
    ActivityDeliveryTimeSlot, Customer, DeliveryEndpoint,\
    Tracer, ActivityProduction, Isotope, ActivityOrder, Vial, InjectionOrder,\
    OrderStatus

with mock.patch('production.SECRET_KEY'):
  from websocket import consumer

# Testing library


# Asgi Loading
django_asgi_app = get_asgi_application()

from websocket import routing # Import that this line is here, otherwise load order is fucked up
class FakeDatetime(DateTimeNow):
  def now(self):
    return datetime.datetime(2012,10,11,11,22,33, tzinfo=datetime.timezone(offset=datetime.timedelta(seconds=60*60), name="Europa/Copenhagen")) # pragma: no cover

app = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : SessionMiddlewareStack(AuthMiddlewareStack(
    URLRouter([re_path(r'ws/$', consumer.Consumer.as_asgi(datetimeNow=FakeDatetime()))]))
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
      DATA_AUTH : {
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
    self.user = User(username=TEST_ADMIN_USERNAME, user_group=UserGroups.Admin)
    self.user.set_password(TEST_ADMIN_PASSWORD)
    self.user.save()

    self.isotope = Isotope(
      atomic_number=92,
      atomic_mass=235,
      halflife_seconds=1337, # it's more but doesn't matter,
      atomic_letter='U'
    )

    self.isotope.save(self.user)
    self.inj_tracer = Tracer(
      id=3,
      isotope=self.isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=2,
      vial_tag=""
    )
    self.inj_tracer.save(self.user)

    self.act_tracer = Tracer(
      isotope=self.isotope,
      shortname = "tracer",
      clinical_name="",
      tracer_type=1,
      vial_tag=""
    )
    self.act_tracer.save(self.user)

    self.production = ActivityProduction(
      tracer=self.act_tracer,
      production_day = 3,
      production_time = "07:00:00",
    )
    self.production.save(self.user)


    self.production_later = ActivityProduction(
      tracer=self.act_tracer,
      production_day = 3,
      production_time = "12:00:00",
    )

    self.production_later.save(self.user)

    self.customer = Customer(
      id = 78453,
      short_name = "test",
      long_name = "teeest"
    )
    self.customer.save(self.user)
    self.endpoint = DeliveryEndpoint(
      id = 67,
      owner = self.customer,
      name="endpoint",
    )

    self.endpoint.save(self.user)

    self.timeSlot= ActivityDeliveryTimeSlot(
      id = 7,
      weekly_repeat = 0,
      delivery_time = "08:00:00",
      destination=self.endpoint,
      production_run=self.production
    )
    self.timeSlot.save(self.user)

    self.timeSlot_later = ActivityDeliveryTimeSlot(
      id = 8,
      weekly_repeat = 0,
      delivery_time = "18:00:00",
      destination=self.endpoint,
      production_run=self.production_later
    )
    self.timeSlot_later.save(self.user)

    self.moved_order = ActivityOrder(
      id = 36,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=OrderStatus.Ordered,
      comment=None,
      ordered_time_slot=self.timeSlot_later,
      moved_to_time_slot=self.timeSlot,
    )
    self.moved_order.save(self.user)

    self.late_order = ActivityOrder(
      id = 37,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=OrderStatus.Accepted,
      comment=None,
      ordered_time_slot=self.timeSlot_later,
    )
    self.late_order.save(self.user)

    self.to_be_freed_order = ActivityOrder(
      id = 1245,
      ordered_activity = 42181,
      delivery_date = "2020-06-11",
      status=OrderStatus.Accepted,
      comment=None,
      ordered_time_slot=self.timeSlot,
    )
    self.to_be_freed_order.save(self.user)

    self.vial = Vial(
      id=15934,
      tracer=self.act_tracer,
      activity=48812,
      volume=13.82,
      lot_number="Test-200611-1",
      fill_time="11:33:55",
      fill_date="2020-06-11",
      assigned_to=None,
      owner=self.customer,
    )
    self.vial.save(self.user)

    self.injection_order = InjectionOrder(
      id = 481,
      delivery_time="09:07:45",
      delivery_date="2020-06-11",
      injections=1,
      status=OrderStatus.Accepted,
      tracer_usage=1,
      comment=None,
      endpoint=self.endpoint,
      tracer=self.inj_tracer,
      lot_number=None,
      freed_datetime=None,
      freed_by=None,
    )

    self.injection_order.save(self.user)

  def tearDown(self):
    InjectionOrder.objects.all().delete()
    Vial.objects.all().delete()
    ActivityOrder.objects.all().delete()
    ActivityDeliveryTimeSlot.objects.all().delete()
    DeliveryEndpoint.objects.all().delete()
    Customer.objects.all().delete()
    ActivityProduction.objects.all().delete()
    Tracer.objects.all().delete()
    Isotope.objects.all().delete()
    User.objects.all().delete()

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
    await comm.disconnect()

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
    self.assertEqual(whoAmIMessage[AUTH_USER], {})

  async def test_login_wrong_password(self):
    comm = WebsocketCommunicator(app,"ws/", headers=b'')
    _conn, subprotocol = await comm.connect()

    response = await self._sendReceive(comm, {
      DATA_AUTH : {
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
    self.assertEqual(whoAmIMessage[AUTH_USER], {})


  ##### Error handling #####
  # These Test showcase how the Consumer handles messages, that are invalid in some form or another
  async def test_invalidated_Message(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {})
    await comm.disconnect()


    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_ERROR)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ERROR], { ERROR_TYPE : ERROR_NO_MESSAGE_ID })

  async def test_InvalidMessageType(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
      WEBSOCKET_MESSAGE_TYPE : "Not a message type!",
    })
    await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_ERROR)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ID], self.message_id)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ERROR], {ERROR_TYPE : ERROR_INVALID_MESSAGE_TYPE})


  async def test_InvalidJavascript(self):
    comm = WebsocketCommunicator(app, "ws/", headers=b'')
    _conn, subprotocal = await comm.connect()

    response = await self._sendReceive(comm, {
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_JAVASCRIPT_VERSION : '1.0.0',
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,
    })
    await comm.disconnect()

    self.assertEqual(response[WEBSOCKET_MESSAGE_SUCCESS], WEBSOCKET_MESSAGE_ERROR)
    self.assertEqual(response[WEBSOCKET_MESSAGE_ERROR], {ERROR_TYPE : ERROR_INVALID_JAVASCRIPT_VERSION})

  ##### Message Testing #####
  async def test_GetState(self):
    response = await self._loginAdminSendRecieve({
      WEBSOCKET_MESSAGE_ID : self.message_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    self.assertEqual(self.message_id, response[WEBSOCKET_MESSAGE_ID])


  async def test_ModelCreate_ClosedDate(self):
    keyword = DATA_CLOSED_DATE
    Model = MODELS[keyword]

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

  async def test_moveOrders(self):
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      DATA_ACTIVITY_ORDER : [36],
      DATA_DELIVER_TIME : 7,
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MOVE_ORDERS,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })

    returnMessage = await comm_admin.receive_json_from()
    await comm_admin.disconnect()

    await database_sync_to_async(self.late_order.refresh_from_db)()

    timeSlot: ActivityDeliveryTimeSlot = await database_sync_to_async(self.late_order.__getitem__)('moved_to_time_slot')
    self.assertEqual(self.timeSlot.id, 7)

  async def test_RestoreOrder(self):
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      DATA_ACTIVITY_ORDER : [36],
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_RESTORE_ORDERS,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    message = await comm_admin.receive_json_from()

    await comm_admin.disconnect()

    await database_sync_to_async(self.moved_order.refresh_from_db)()
    self.assertIsNone(self.moved_order.moved_to_time_slot)

  async def test_freeActivityOrder(self):
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      DATA_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : TEST_ADMIN_PASSWORD,
      },
      WEBSOCKET_DATA : {
        DATA_VIAL : [self.vial.id],
        DATA_DELIVER_TIME : 7,
        DATA_ACTIVITY_ORDER : [self.to_be_freed_order.id],
      },
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    message = await comm_admin.receive_json_from()
    await comm_admin.disconnect()

  async def test_freeActivityOrder_rejected(self):
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      DATA_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : "NOT ADMIN PASSWORD",
      },
      WEBSOCKET_DATA : {
        DATA_VIAL : [self.vial.id],
        DATA_DELIVER_TIME : 7,
        DATA_ACTIVITY_ORDER : [self.to_be_freed_order.id],
      },
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    message = await comm_admin.receive_json_from()
    await comm_admin.disconnect()

    self.assertFalse(message[AUTH_IS_AUTHENTICATED])
    await database_sync_to_async(self.to_be_freed_order.refresh_from_db)()
    self.assertEqual(self.to_be_freed_order.status, OrderStatus.Accepted.value)


  async def test_freeInjectionOrder(self):
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      DATA_AUTH : {
        AUTH_USERNAME : TEST_ADMIN_USERNAME,
        AUTH_PASSWORD : TEST_ADMIN_PASSWORD,
      },
      WEBSOCKET_DATA : {
        WEBSOCKET_DATA_ID : self.injection_order.id,
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
        DATA_AUTH : {
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

  async def test_deleteSingleModel(self):
    customer_1 = Customer(
      id = 178453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer_1.save)()

    customer_2 = Customer(
      id = 278454,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer_2.save)()
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      WEBSOCKET_DATA_ID : 278454,
      WEBSOCKET_DATATYPE : DATA_CUSTOMER,
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    message = await comm_admin.receive_json_from()
    await comm_admin.disconnect()
    # Assert Model is gone
    with self.assertRaises(ObjectDoesNotExist):
      await database_sync_to_async(Customer.objects.get)(pk=278454)

    customer_1_again: Customer = await database_sync_to_async(Customer.objects.get)(pk=178453)
    await database_sync_to_async(customer_1_again.delete)() # Clean up for other functions


  async def test_deleteMultipleModels(self):
    customer_1 = Customer(
      id = 278453,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer_1.save)()

    customer_2 = Customer(
      id = 178454,
      short_name = "test",
      long_name = "teeest"
    )
    await database_sync_to_async(customer_2.save)()
    comm_admin = WebsocketCommunicator(app,"ws/")
    _conn, _subprotocal = await comm_admin.connect()

    await comm_admin.send_json_to(self.loginAdminMessage)
    admin_login_message = await comm_admin.receive_json_from()

    await comm_admin.send_json_to({
      WEBSOCKET_DATA_ID : [278453,178454],
      WEBSOCKET_DATATYPE : DATA_CUSTOMER,
      WEBSOCKET_MESSAGE_ID : 69230481,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
      WEBSOCKET_JAVASCRIPT_VERSION : JAVASCRIPT_VERSION,
    })
    message = await comm_admin.receive_json_from()
    await comm_admin.disconnect()

    # Assert Model is gone
    with self.assertRaises(ObjectDoesNotExist):
      await database_sync_to_async(Customer.objects.get)(pk=278453)

    with self.assertRaises(ObjectDoesNotExist):
      await database_sync_to_async(Customer.objects.get)(pk=178454)

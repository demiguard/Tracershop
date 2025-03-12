# Python standard library
from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock

# Third party modules
from django.utils import timezone

# Tracershop Modules
from constants import ERROR_LOGGER
from core.exceptions import IllegalActionAttempted
from shared_constants import WEBSOCKET_DATE, WEBSOCKET_MESSAGE_READ_BOOKINGS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_DATA_ID,\
  DATA_TELEMETRY_REQUEST, DATA_TELEMETRY_RECORD, WEBSOCKET_MESSAGE_READ_TELEMETRY,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_READ_STATE
from testing import TransactionTracershopTestCase

from database.database_interface import DatabaseInterface
from database.models import Booking, User, UserGroups

from websocket.handler.handle_get_bookings import HandleReadBooking
from websocket.consumer import Consumer
from websocket.messenger import Messenger
from core.side_effect_injection import DateTimeNow

class DatetimeMock:
  def now(self):
    return datetime(2000, 1, 1, 1, 1, 1, tzinfo=timezone.now().tzinfo),

async def mock_get_user(scope):
  return scope['user']

with mock.patch('channels.auth.get_user', mock_get_user):
  from websocket.handler.handle_get_telemetry import HandleReadTelemetry
  from websocket.handler.handle_get_state import HandleReadState

class ReadHandlersTestCases(TransactionTracershopTestCase):
  def setUp(self):
    self.mockConsumer = mock.Mock(spec=Consumer)
    self.mockDatabase = mock.Mock(spec=DatabaseInterface)
    self.mockMessenger = mock.AsyncMock(spec=Messenger)

    self.mockConsumer.datetimeNow = mock.Mock(spec=DateTimeNow)
    self.mockConsumer.datetimeNow.now.return_value=datetime(2000, 1, 1, 1, 1, 1, tzinfo=timezone.now().tzinfo)

    self.mockConsumer.db = self.mockDatabase
    self.mockConsumer.messenger = self.mockMessenger

  def tearDown(self):
    pass

  async def test_handler_booking(self):
    handler = HandleReadBooking()

    self.mockDatabase.get_bookings.return_value = [
      Booking(id = 1),
      Booking(id = 2),
      Booking(id = 3)
    ]

    await handler(self.mockConsumer, {
      WEBSOCKET_DATE : "2000-05-05",
      WEBSOCKET_DATA_ID : 1,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_BOOKINGS,
      WEBSOCKET_MESSAGE_ID : 23613,
    })

    self.mockConsumer.send_json.assert_called_once_with({
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : 23613,
      WEBSOCKET_DATA : mock.ANY,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_BOOKINGS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value
    })
    self.mockDatabase.get_bookings.assert_called_once()

  async def test_getting_telemetry(self):
    handler = HandleReadTelemetry()

    self.mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.Admin)
    }

    self.mockDatabase.get_telemetry_data.return_value = {
      DATA_TELEMETRY_RECORD : [],
      DATA_TELEMETRY_REQUEST : []
    }

    await handler(self.mockConsumer, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_TELEMETRY,
      WEBSOCKET_MESSAGE_ID : 23613,
    })

    self.mockMessenger.assert_awaited()

  async def test_getting_telemetry_illegal(self):
    handler = HandleReadTelemetry()

    self.mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    self.mockDatabase.get_telemetry_data.return_value = {
      DATA_TELEMETRY_RECORD : [],
      DATA_TELEMETRY_REQUEST : []
    }

    with self.assertRaises(IllegalActionAttempted):
      await handler(self.mockConsumer, {
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_TELEMETRY,
          WEBSOCKET_MESSAGE_ID : 23613,
        })

  async def test_handler_read_state(self):
    handler = HandleReadState()

    self.mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    await handler(
      self.mockConsumer, {
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_STATE,
        WEBSOCKET_MESSAGE_ID : 125451,
      }
    )

  async def test_handler_get_state_with_date(self):
    handler = HandleReadState()

    self.mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }


    await handler(
      self.mockConsumer, {
        WEBSOCKET_DATE : "2002-06-06",
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_STATE,
        WEBSOCKET_MESSAGE_ID : 125451,
      }
    )

  async def test_handler_get_state_with_date_and_error(self):
    handler = HandleReadState()

    self.mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    with self.assertLogs(ERROR_LOGGER):
      await handler(
        self.mockConsumer, {
          WEBSOCKET_DATE : "20054/06/06", # fails because i didn't regex this shit
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_READ_STATE,
          WEBSOCKET_MESSAGE_ID : 125451,
        }
      )

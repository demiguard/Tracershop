# Python standard library
from datetime import datetime
from unittest import mock

# Third party modules
from django.utils import timezone

# Tracershop Modules
from constants import ERROR_LOGGER
from core.exceptions import IllegalActionAttempted
from shared_constants import WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_BOOKINGS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_DATA_ID,\
  DATA_TELEMETRY_REQUEST, DATA_TELEMETRY_RECORD, WEBSOCKET_MESSAGE_GET_TELEMETRY,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_GET_STATE
from testing import TransactionTracershopTestCase

from database.database_interface import DatabaseInterface
from database.models import Booking, User, UserGroups

from websocket.handler.handle_get_bookings import HandleGetBooking
from websocket.consumer import Consumer

class DatetimeMock:
  def now(self):
    return datetime(2000, 1, 1, 1, 1, 1, tzinfo=timezone.now().tzinfo),

async def mock_get_user(scope):
  return scope['user']

with mock.patch('channels.auth.get_user', mock_get_user):
  from websocket.handler.handle_get_telemetry import HandleGetTelemetry
  from websocket.handler.handle_get_state import HandleGetState

class GettingHandlersTestCases(TransactionTracershopTestCase):
  def tearDown(self):
    pass

  async def test_handler_booking(self):
    handler = HandleGetBooking()
    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)

    mockDatabase.get_bookings.return_value = [
      Booking(id = 1),
      Booking(id = 2),
      Booking(id = 3)
    ]

    mockConsumer.db = mockDatabase

    await handler(mockConsumer, {
      WEBSOCKET_DATE : "2000-05-05",
      WEBSOCKET_DATA_ID : 1,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_BOOKINGS,
      WEBSOCKET_MESSAGE_ID : 23613,
    })

    mockConsumer.send_json.assert_called_once_with({
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : 23613,
      WEBSOCKET_DATA : mock.ANY,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_BOOKINGS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value
    })
    mockDatabase.get_bookings.assert_called_once()

  async def test_getting_telemetry(self):
    handler = HandleGetTelemetry()

    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)
    mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.Admin)
    }
    mockConsumer.db = mockDatabase

    mockDatabase.get_telemetry_data.return_value = {
      DATA_TELEMETRY_RECORD : [],
      DATA_TELEMETRY_REQUEST : []
    }

    await handler(mockConsumer, {
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_TELEMETRY,
      WEBSOCKET_MESSAGE_ID : 23613,
    })

    mockConsumer.send_json.assert_called_once()

  async def test_getting_telemetry_illegal(self):
    handler = HandleGetTelemetry()

    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)
    mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }
    mockConsumer.db = mockDatabase

    mockDatabase.get_telemetry_data.return_value = {
      DATA_TELEMETRY_RECORD : [],
      DATA_TELEMETRY_REQUEST : []
    }

    with self.assertRaises(IllegalActionAttempted):
      await handler(mockConsumer, {
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_TELEMETRY,
          WEBSOCKET_MESSAGE_ID : 23613,
        })

  async def test_handler_get_state(self):
    handler = HandleGetState()

    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)
    mockConsumer.datetimeNow = DatetimeMock()
    mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    mockConsumer.db = mockDatabase


    await handler(
      mockConsumer, {
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
        WEBSOCKET_MESSAGE_ID : 125451,
      }
    )

  async def test_handler_get_state_with_date(self):
    handler = HandleGetState()

    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)
    mockConsumer.datetimeNow = DatetimeMock()
    mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    mockConsumer.db = mockDatabase

    await handler(
      mockConsumer, {
        WEBSOCKET_DATE : "2002-06-06",
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
        WEBSOCKET_MESSAGE_ID : 125451,
      }
    )

  async def test_handler_get_state_with_date_and_error(self):
    handler = HandleGetState()

    mockDatabase = mock.Mock(spec=DatabaseInterface)
    mockConsumer = mock.Mock(spec=Consumer)
    mockConsumer.datetimeNow = DatetimeMock()
    mockConsumer.scope = {
      'user' : User(id=13287540, username="Blah blah", user_group=UserGroups.ShopAdmin)
    }

    mockConsumer.db = mockDatabase

    with self.assertLogs(ERROR_LOGGER):
      await handler(
        mockConsumer, {
          WEBSOCKET_DATE : "20054/06/06", # fails because i didn't regex this shit
          WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_STATE,
          WEBSOCKET_MESSAGE_ID : 125451,
        }
      )

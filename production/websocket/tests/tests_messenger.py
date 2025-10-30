# Python Standard Library
from unittest.mock import AsyncMock, patch, MagicMock


# Thrid party modules
from django.test import TestCase
from channels.layers import get_channel_layer

# Tracershop imports
from database.models import Booking
from constants import MESSENGER_CONSUMER
from shared_constants import *

from websocket.consumer import Consumer
from websocket.messenger import Messenger
from websocket.messenger.messenger_delete_booking import MessengerDeleteBooking
from websocket.messenger.messenger_create_booking import MessengerCreateBooking
from websocket.messenger.messenger_read_bookings  import MessengerReadBooking

class MessengerTestCases(TestCase):
  @classmethod
  def setUpTestData(cls):
    pass

  def setUp(self) -> None:
    self.messenger = Messenger()

  async def test_messengers_are_typed_checked(self):
    for messenger in self.messenger.messengers.values():
      try:
        await messenger(1) # type: ignore # this is what we are testing
        self.assertTrue(False)
      except TypeError:
        pass


  async def test_send_create_booking(self):
    test_state_data = { DATA_BOOKING : [Booking()]}
    args = MessengerCreateBooking.getMessageArgs()(**{WEBSOCKET_DATA: test_state_data})

    mock_channel_layer = MagicMock()
    mock_channel_layer.group_send = AsyncMock()

    with patch('websocket.messenger.messenger_create_booking.get_channel_layer', return_value=mock_channel_layer):
      messenger = MessengerCreateBooking()
      await messenger(args)

      mock_channel_layer.group_send.assert_called_once()

  async def test_send_delete_booking(self):
    args = MessengerDeleteBooking.getMessageArgs()(**{WEBSOCKET_DATA_ID: [1,2,3,4,5]})

    mock_channel_layer = MagicMock()
    mock_channel_layer.group_send = AsyncMock()

    with patch('websocket.messenger.messenger_delete_booking.get_channel_layer', return_value=mock_channel_layer):
      messenger = MessengerDeleteBooking()
      await messenger(args)

      mock_channel_layer.group_send.assert_called_once()

  async def test_send_read_bookings(self):
    mock_consumer = MagicMock(spec=Consumer)

    args = MessengerReadBooking.getMessageArgs()(**{
      WEBSOCKET_MESSAGE_ID : 125012,
      MESSENGER_CONSUMER : mock_consumer,
      WEBSOCKET_DATA : {
        DATA_BOOKING : []
      }
    })

    messenger = MessengerReadBooking()

    await messenger(args)

    mock_consumer.send_json.assert_called_once()
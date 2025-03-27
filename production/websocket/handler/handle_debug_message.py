"""This handler is dynamically loaded and handles all incoming debug messages
Debug messages are commands to the server, that
"""

# Python standard library
from enum import Enum
from typing import Any, Dict, Literal

# Third party packages
from django.conf import settings
from channels.auth import get_user
from channels.db import database_sync_to_async

# Tracershop packages
from shared_constants import WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES,\
  DATA_BOOKING
from lib.utils import classproperty
from websocket.consumer import Consumer
from websocket.handler_base import HandlerBase
from database.models import User, Booking

DEBUG_MESSAGE = "debug_message"

class DebugMessages(Enum):
  DEBUG_CREATE_BOOKING = "debugCreateBooking"
  DEBUG_DELETE_BOOKING = "debugDeleteBooking"

class HandleDebugMessage(HandlerBase):
  def __init__(self, debug=settings.DEBUG) -> None:
    super().__init__()
    self.debug = debug

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_DEBUG_MESSAGE

  async def __call__(self, consumer: Consumer, message: Dict[Any, Any]):
    if not self.debug:
      # NO DEBUG MESSAGES IN PROD!
      return

    user: User = await get_user(consumer.scope)
    if not user.is_server_admin:
      # Only admin can trigger debug messages
      return

    if DEBUG_MESSAGE not in message:
      # Opsy
      return

    debug_message = DebugMessages(message[DEBUG_MESSAGE])

    match debug_message:
      case DebugMessages.DEBUG_CREATE_BOOKING:
        booking = await database_sync_to_async(
          Booking.objects.create
        )(**{
          'status' : message['status'],
          'location' : message['location'],
          'procedure' : message['procedure'],
          'accession_number' : message['accession_number'],
          'start_time' : message['start_time'],
          'start_date' : message['start_date'],
        })

        await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_CREATE_BOOKING, {
          DATA_BOOKING : [booking]
        })
      case DebugMessages.DEBUG_DELETE_BOOKING:
        pass

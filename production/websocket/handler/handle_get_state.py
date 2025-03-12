# Python Standard library
from datetime import datetime
from logging import getLogger

# Django / Channels Imports
from channels.auth import get_user

from django.utils import timezone

# Tracershop imports
from constants import ERROR_LOGGER
from lib.utils import classproperty
from shared_constants import WEBSOCKET_DATE,\
  SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES

from websocket.consumer import Consumer
from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleReadState(HandlerBase):
  @classproperty
  def message_type(self):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_GET_STATE

  async def __call__(self, consumer: Consumer, message):
    now = consumer.datetimeNow.now()

    if WEBSOCKET_DATE in message:
      try:
        now = datetime.strptime(message[WEBSOCKET_DATE][:10], '%Y-%m-%d')
        now = datetime.astimezone(now, timezone.now().tzinfo)
      except ValueError:
        error_logger.error(f"Attempting to convert {message[WEBSOCKET_DATE]} but it failed!")

    # Assumed to have no Field in the message since it can use the user in scope

    state = await consumer.db.getState(now,
                                       await get_user(consumer.scope))

    await consumer.messenger(
      WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
        "consumer" : consumer,
        "message_id" : message[WEBSOCKET_MESSAGE_ID],
        "status" : SUCCESS_STATUS_CRUD.SUCCESS,
        "data" : state,
        "refresh" : True,
      }
    )
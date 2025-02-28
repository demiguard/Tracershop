# Python Standard library
from datetime import datetime
from logging import getLogger

# Django / Channels Imports
from channels.auth import get_user

from django.utils import timezone

# Tracershop imports
from constants import ERROR_LOGGER

from shared_constants import WEBSOCKET_MESSAGE_GET_STATE, WEBSOCKET_DATE,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_REFRESH

from websocket.consumer import Consumer
from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleGetState(HandlerBase):
  @property
  def message_type(self):
    return WEBSOCKET_MESSAGE_GET_STATE

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

    await consumer.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : state,
      WEBSOCKET_REFRESH : True,
    })
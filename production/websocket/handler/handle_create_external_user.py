# Python Standard library
from logging import getLogger
from typing import Tuple, Optional

# Django / Channels Imports
from channels.auth import get_user

# Tracershop imports
from core.exceptions import IllegalActionAttempted
from database.models import User, UserAssignment
from constants import ERROR_LOGGER

from shared_constants import WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,\
  DATA_USER, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_SUCCESS, DATA_USER_ASSIGNMENT,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_UPDATE_STATE

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleCreateExternalUser(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)
    if not user.is_production_admin:
      raise IllegalActionAttempted
    newUser, newUserAssignment = await consumer.db.createExternalUser(
      message[WEBSOCKET_DATA]
    )

    if newUserAssignment is not None:
      data = {
        DATA_USER : [newUser],
        DATA_USER_ASSIGNMENT : [newUserAssignment]
      }
    else:
      data = {DATA_USER : [newUser]}

    await consumer._broadcastProduction({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    })

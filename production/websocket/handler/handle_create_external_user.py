# Python Standard library
from logging import getLogger
from typing import Tuple, Optional

# Django / Channels Imports
from channels.auth import get_user

# Tracershop imports
from core.exceptions import IllegalActionAttempted
from database.models import User, UserAssignment
from constants import ERROR_LOGGER
from lib.utils import classproperty
from constants import MESSENGER_CONSUMER
from shared_constants import DATA_USER, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_SUCCESS, DATA_USER_ASSIGNMENT,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleCreateExternalUser(HandlerBase):

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER

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
      data = { DATA_USER : [newUser]}

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
    })
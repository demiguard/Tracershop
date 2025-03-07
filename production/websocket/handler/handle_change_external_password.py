# Python Standard library
from logging import getLogger
from typing import Tuple, Optional

# Django / Channels Imports
from channels.auth import get_user
from django.core.exceptions import ObjectDoesNotExist

# Tracershop imports
from constants import ERROR_LOGGER
from core.exceptions import IllegalActionAttempted
from database.models import User
from lib.utils import classproperty
from shared_constants import WEBSOCKET_MESSAGE_TYPES,\
  AUTH_PASSWORD, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_DATA_ID,\
  WEBSOCKET_OBJECT_DOES_NOT_EXISTS, WEBSOCKET_MESSAGE_TYPE

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleChangeExternalPassword(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)
    # Message Extraction
    externalUserID = message[WEBSOCKET_DATA_ID]
    externalNewPassword = message[AUTH_PASSWORD]

    if user.is_production_admin:
      error_logger.error(f"User: {user.username} attempted to change password of {externalUserID}")
      return

    try:
      await consumer.db.changeExternalPassword(externalUserID, externalNewPassword)
    except ObjectDoesNotExist:
      return await consumer.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_OBJECT_DOES_NOT_EXISTS,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT,
      })
    except IllegalActionAttempted:
      error_logger.error("Somehow an illegal action was attempted!")
      return
    # Success return message
    await consumer.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS
    })
# Python Standard library
from logging import getLogger
from typing import Tuple, Optional

# Django / Channels Imports
from channels.auth import get_user

# Tracershop imports
from database.models import User, UserAssignment
from constants import ERROR_LOGGER
from lib.utils import classproperty
from shared_constants import DATA_USER, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_SUCCESS, DATA_USER_ASSIGNMENT,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPES

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleCreateUserAssignment(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope)
    username = message['username']
    customerID = message['customer_id']

    temp_res: Tuple[SUCCESS_STATUS_CREATING_USER_ASSIGNMENT,
                    Optional[UserAssignment],
                    Optional[User]] = await consumer.db.createUserAssignment(username, customerID, user)
    success, user_assignment, new_user = temp_res

    if success != SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS:
      return await consumer.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_STATUS : success.value,
      })

    if user_assignment is None: # pragma no cover
      error_logger.critical("Somebody somewhere fucked up a contract...")

    data_dict = {
      DATA_USER_ASSIGNMENT : [user_assignment],
    }

    if new_user is not None:
      data_dict[DATA_USER] = [new_user]


    return await consumer.broadcastGlobal({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : success.value,
      WEBSOCKET_DATA : data_dict,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
    })

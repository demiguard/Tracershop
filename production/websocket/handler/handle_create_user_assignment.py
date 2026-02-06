# Python Standard library
from logging import getLogger
from typing import Any, Dict, Tuple, Optional

# Django / Channels Imports
from channels.auth import get_user

# Tracershop imports
from database.models import User, UserAssignment
from constants import ERROR_LOGGER, MESSENGER_CONSUMER
from lib.utils import classproperty
from shared_constants import DATA_USER, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_STATUS, AUTH_USERNAME, DATA_USER_ASSIGNMENT,\
  WEBSOCKET_DATA, WEBSOCKET_REFRESH, WEBSOCKET_ERROR,\
  WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_SERVER_MESSAGES
from tracerauth.message_validation import Message

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleCreateUserAssignment(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      AUTH_USERNAME : str,
      "customer_id" : int,
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope)
    username = message[AUTH_USERNAME]
    customerID = message['customer_id']

    temp_res: Tuple[SUCCESS_STATUS_CRUD,
                    Optional[UserAssignment],
                    Optional[User]] = await consumer.db.a_create_user_assignment(username, customerID, user)
    success, user_assignment, new_user = temp_res

    if success != SUCCESS_STATUS_CRUD.SUCCESS:
      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_ERROR, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_ERROR : "",
        WEBSOCKET_MESSAGE_STATUS : success,
      })

      return

    if user_assignment is None: # pragma no cover
      error_logger.critical("Somebody somewhere fucked up a contract...")

    data_dict: Dict[str, Any] = {
      DATA_USER_ASSIGNMENT : [user_assignment],
    }

    if new_user is not None:
      data_dict[DATA_USER] = [new_user]

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_STATUS : success,
      WEBSOCKET_DATA : data_dict,
      WEBSOCKET_REFRESH : False,
    })

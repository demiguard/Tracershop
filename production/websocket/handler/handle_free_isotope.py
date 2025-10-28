"""This is the handler responsible for handling release requests of isotope
orders
"""
# Python standard library
from logging import getLogger
from typing import Any, Dict

# Tracershop Packages
from constants import MESSENGER_CONSUMER, ERROR_LOGGER, DEBUG_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_DATA, AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  DATA_ISOTOPE_VIAL, DATA_ISOTOPE_ORDER, DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD
from lib.utils import classproperty
from tracerauth.auth import get_logged_in_user
from tracerauth.types import AuthenticationResult
from tracerauth.message_validation import Message, Array
from websocket.consumer import Consumer
from websocket.handler_base import HandlerBase

debug_logger = getLogger(DEBUG_LOGGER)
error_logger = getLogger(ERROR_LOGGER)

class HandleFreeIsotope(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      WEBSOCKET_DATA : {
        DATA_ISOTOPE_ORDER : Array(int),
        DATA_ISOTOPE_VIAL : Array(int)
      },
      DATA_AUTH : {
        AUTH_USERNAME : str,
        AUTH_PASSWORD : str,
      }
    })


  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_FREE_ISOTOPE

  async def __call__(self, consumer: Consumer, message):
    """Frees isotope orders
    """
    scope_user = await get_logged_in_user(consumer.scope)
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      debug_logger.debug(f"User {user.username} was not authenticated")
      return await consumer._RejectFreeing(message)

    if scope_user is None or user.id != scope_user.id:
      error_logger.info(f"User {user.username} tried to release in {scope_user.username}")
      return await consumer._RejectFreeing(message)

    try:
      updated_state = await consumer.db.a_release_isotope_order(
        message[WEBSOCKET_DATA], user, consumer.datetimeNow.now()
      )

      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, {
          MESSENGER_CONSUMER : consumer,
          AUTH_IS_AUTHENTICATED : True,
          WEBSOCKET_REFRESH : False,
          WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
          WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
          WEBSOCKET_DATA : updated_state
        })
    except Exception as exception:
      error_logger.error("Releasing an isotope order encountered an error:")
      error_logger.error(exception)

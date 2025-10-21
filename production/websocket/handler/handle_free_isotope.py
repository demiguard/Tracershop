"""This is the handler responsible for handling release requests of isotope
orders
"""
# Python standard library
from typing import Any, Dict

# Tracershop Packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_DATA, AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_ID,\
  DATA_ISOTOPE_VIAL, DATA_ISOTOPE_ORDER, DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD
from lib.utils import classproperty
from tracerauth.types import AuthenticationResult
from tracerauth.message_validation import Message, Array
from websocket.consumer import Consumer
from websocket.handler_base import HandlerBase


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
    """This is the handler it assumes the message is a json object with the
    following specialized structure:
    {
      DATA_AUTH : {
        AUTH_USERNAME : username of the authenticating user
        AUTH_PASSWORD : password for the authenticating user
      }
      WEBSOCKET_DATA : {
        DATA_ISOTOPE_ORDER : Order_id
        DATA_ISOTOPE_VIAL : List<Vial id>
      }
    }

    Args:
        consumer (Consumer): _description_
        message (_type_): _description_

    Returns:
        _type_: _description_
    """
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    scope_user = consumer.scope.get('user')
    if scope_user is None or user != scope_user:
      return await consumer._RejectFreeing(message)

    try:
      updated_state = await consumer.db.release_isotope_order(
        message[WEBSOCKET_DATA], user, consumer.datetimeNow.now()
      )
      #log_release_isotope_orders()

      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, {
          MESSENGER_CONSUMER : consumer,
          AUTH_IS_AUTHENTICATED : True,
          WEBSOCKET_REFRESH : False,
          WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
          WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
          WEBSOCKET_DATA : updated_state
        })
    except Exception:
      # Send an error back, that stuff went wrong

      pass

# Python Standard Library

# Third Party Module

# Tracershop Modules
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_DATA,\
  DATA_DELIVER_TIME, DATA_ACTIVITY_ORDER, DATA_VIAL, AUTH_IS_AUTHENTICATED,\
  WEBSOCKET_REFRESH, DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPES,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD
from tracerauth.message_validation import Message, Array
from tracerauth.types import AuthenticationResult
from tracerauth.audit_logging import logFreeActivityOrders
from lib.utils import classproperty
from websocket.handler_base import HandlerBase

class HandleFreeActivity(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      DATA_AUTH : {
        AUTH_USERNAME : str,
        AUTH_PASSWORD : str
      },
      WEBSOCKET_DATA : {
        DATA_DELIVER_TIME : int,
        DATA_VIAL : Array(int),
        DATA_ACTIVITY_ORDER : Array(int)
      }
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_FREE_ACTIVITY

  async def __call__(self, consumer, message):
    """Handler for freeing an activity order

      Args:
        message (Dict): Message send by the user with the fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_DELIVER_TIME_ID - ID of activity order time slot to be freed
            DATA_VIAL - A list of Vial ID that's being freed with this order
          DATA_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username

    """
    # This is 4 step function
    # 1. Authenticate, if fail return
    # 2. Assign vials to order
    # 3. update order
    # 4. Broadcast to users

    # Turn this into a function
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    # Authentication successful update
    data = message[WEBSOCKET_DATA]
    orders, vials = await consumer.db.releaseOrders(data[DATA_DELIVER_TIME],
                                                    data[DATA_ACTIVITY_ORDER],
                                                    data[DATA_VIAL],
                                                    user,
                                                    consumer.datetimeNow.now())
    logFreeActivityOrders(user, orders, vials)

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, {
      MESSENGER_CONSUMER : consumer,
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : {
        DATA_ACTIVITY_ORDER : orders,
        DATA_VIAL : vials
      },
    })

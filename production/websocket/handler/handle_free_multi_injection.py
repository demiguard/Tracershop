# Python standard library

# Third party packages

# Tracershop packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATA, DATA_INJECTION_ORDER,\
  AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS, DATA_AUTH, AUTH_USERNAME,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPES, AUTH_PASSWORD
from lib.utils import classproperty
from tracerauth.audit_logging import logReleaseManyInjectionOrders
from tracerauth.types import AuthenticationResult
from tracerauth.message_validation import Message, Array
from websocket.handler_base import HandlerBase

class HandleFreeMultiInjection(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      DATA_AUTH : {
        AUTH_USERNAME : str,
        AUTH_PASSWORD : str
      },
      WEBSOCKET_DATA_ID : Array(int),
      WEBSOCKET_DATA : str
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_RELEASE_MULTI

  async def __call__(self, consumer, message):
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    if not user.is_production_member:
      return await consumer._RejectFreeing(message)

    release_time = consumer.datetimeNow.now()

    orders = await consumer.db.release_many_injections_orders(
      message[WEBSOCKET_DATA_ID], message[WEBSOCKET_DATA], release_time, user
    )

    if len(orders) > 0:
      order = orders[0]
      logReleaseManyInjectionOrders(
        user, [order for order in orders], order.lot_number
      )


    return await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,{
      MESSENGER_CONSUMER : consumer,
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : {
        DATA_INJECTION_ORDER : orders
      }
    })

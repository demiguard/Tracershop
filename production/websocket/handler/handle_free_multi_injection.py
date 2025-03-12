# Python standard library

# Third party packages

# Tracershop packages
from shared_constants import WEBSOCKET_MESSAGE_RELEASE_MULTI,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATA, DATA_INJECTION_ORDER,\
  AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPES
from lib.utils import classproperty
from tracerauth.types import AuthenticationResult

from websocket.handler_base import HandlerBase

class HandleFreeMultiInjection(HandlerBase):
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

    return await consumer.broadcastProduction({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : {
        DATA_INJECTION_ORDER : orders
      }
    })

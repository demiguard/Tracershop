# Python standard library

# Third party packages

# Tracershop packages
from shared_constants import WEBSOCKET_MESSAGE_RELEASE_MULTI,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATA, DATA_INJECTION_ORDER,\
  AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_FREE_INJECTION,\
  WEBSOCKET_MESSAGE_SUCCESS

from tracerauth.types import AuthenticationResult

from websocket.handler_base import HandlerBase

class HandleFreeMultiInjection(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_RELEASE_MULTI

  async def __call__(self, consumer, message):
    result, user = await consumer._authenticateFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    if not user.is_production_member:
      return await consumer._RejectFreeing(message)

    release_time = consumer.datetimeNow.now()

    orders = await consumer.db.release_many_injections_orders(
      message[WEBSOCKET_DATA_ID], message[WEBSOCKET_DATA], release_time, user
    )

    updated_orders = await consumer.db.async_serialize_dict({
      DATA_INJECTION_ORDER : orders
    })

    return await consumer._broadcastProduction({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : updated_orders
    })

from websocket.handler_base import HandlerBase

from lib.utils import classproperty
from tracerauth.types import AuthenticationResult

from shared_constants import WEBSOCKET_MESSAGE_CORRECT_ORDER,\
  AUTH_IS_AUTHENTICATED, WEBSOCKET_REFRESH,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_DATA, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_TYPES


class HandleCorrectOrder(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CORRECT_ORDER

  async def __call__(self, consumer, message):
    result, user = await consumer._authenticateFreeing(message)

    if not user.is_production_member:
      return await consumer._RejectFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    corrected_state = await consumer.db.correct_order(
      message[WEBSOCKET_DATA], user
    )

    await consumer.broadcastProduction({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : corrected_state,
    })


# Tracershop modules
from websocket.handler_base import HandlerBase

from lib.utils import classproperty
from tracerauth.message_validation import Message
from tracerauth.types import AuthenticationResult
from constants import MESSENGER_CONSUMER
from shared_constants import SUCCESS_STATUS_CRUD,\
  AUTH_IS_AUTHENTICATED, AUTH_USERNAME, AUTH_PASSWORD,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_DATA, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES, DATA_AUTH

class HandleCorrectOrder(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      DATA_AUTH : {
        AUTH_USERNAME : str,
        AUTH_PASSWORD : str,
      },
      WEBSOCKET_DATA : {
        # There's keys here, but they are optional, and their absense is checked for
      }
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_CORRECT_ORDER

  async def __call__(self, consumer, message):
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    if user is None or not user.is_production_member:
      return await consumer._RejectFreeing(message)


    corrected_state = await consumer.db.correct_order(
      message[WEBSOCKET_DATA], user
    )

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_DATA : corrected_state,
    })

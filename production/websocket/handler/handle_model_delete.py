# Python standard library
from logging import getLogger

# Third party modules
from channels.auth import get_user

# Tracershop modules
from constants import ERROR_LOGGER, MESSENGER_CONSUMER
from database.models import User
from lib.utils import classproperty
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES
from websocket.handler_base import HandlerBase

logger = getLogger(ERROR_LOGGER)

class HandleModelDelete(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      # WEBSOCKET_DATA_ID : int, this can int or array(int), TODO: change it to array(int)
      WEBSOCKET_DATATYPE : {}
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MODEL_DELETE

  async def __call__(self, consumer, message):
    user: User = await get_logged_in_user(consumer.scope)
    success = await consumer.db.deleteModels(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA_ID],
      user
    )

    if success:
      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_STATE, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
        WEBSOCKET_DATA_ID : message[WEBSOCKET_DATA_ID],
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      })
    else:
      logger.error(f"""
        User: {user.username} attempted to delete {message[WEBSOCKET_DATATYPE]}
        They attempted to delete object {message[WEBSOCKET_DATA_ID]}
        """)

      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_STATE, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_DATA_ID : [],
        WEBSOCKET_DATATYPE : "",
      })
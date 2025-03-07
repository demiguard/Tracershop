# Python standard library
from logging import getLogger

# Third party modules
from channels.auth import get_user

# Tracershop modules
from constants import ERROR_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_MODEL_DELETE,\
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_TYPES
from lib.utils import classproperty
from database.models import User

from websocket.handler_base import HandlerBase

logger = getLogger(ERROR_LOGGER)

class HandleModelDelete(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MODEL_DELETE

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)
    success = await consumer.db.deleteModels(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA_ID],
      user
    )

    if success:
      await consumer.broadcastGlobal({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
        WEBSOCKET_DATA_ID : message[WEBSOCKET_DATA_ID],
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })
    else:
      logger.error(f"""
        User: {user.username} attempted to delete {message[WEBSOCKET_DATATYPE]}
        They attempted to delete object {message[WEBSOCKET_DATA_ID]}
        """)

      await consumer.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })
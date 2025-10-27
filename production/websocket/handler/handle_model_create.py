# Python standard library
import logging

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from lib.formatting import format_error_with_datatype
from lib.utils import classproperty
from constants import MESSENGER_CONSUMER
from constants import ERROR_LOGGER
from shared_constants import WEBSOCKET_MESSAGE_MODEL_CREATE,\
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase

error_logger = logging.getLogger(ERROR_LOGGER)

class HandleModelCreate(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      WEBSOCKET_DATA : {},
      WEBSOCKET_DATATYPE : str
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MODEL_CREATE

  async def __call__(self, consumer, message):
    user = await get_logged_in_user(consumer.scope)
    try:
      instances = await consumer.db.handleCreateModels(message[WEBSOCKET_DATATYPE],
                                                       message[WEBSOCKET_DATA],
                                                       user)
    except IntegrityError as e:
      error_message = format_error_with_datatype(e, message[WEBSOCKET_DATATYPE])
      error_logger.error(f"Message: {message[WEBSOCKET_MESSAGE_ID]} - encountered: {error_message}")
      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_ERROR, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.CONSTRAINTS_VIOLATED,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : error_message,
      })

      return
    except ValidationError as e:
      error_logger.error(f"Message: {message[WEBSOCKET_MESSAGE_ID]} - encountered a Validation error!")
      await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_ERROR, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.CONSTRAINTS_VIOLATED,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : e.error_dict,
      })

      return

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : { message[WEBSOCKET_DATATYPE] : instances  },
      WEBSOCKET_REFRESH : False,
    })

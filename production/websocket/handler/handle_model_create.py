# Python standard library

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from lib.utils import classproperty
from shared_constants import WEBSOCKET_MESSAGE_MODEL_CREATE,\
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES

from websocket.handler_base import HandlerBase

class HandleModelCreate(HandlerBase):

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MODEL_CREATE

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope)
    try:
      instances = await consumer.db.handleCreateModels(message[WEBSOCKET_DATATYPE],
                                                       message[WEBSOCKET_DATA],
                                                       user)
    except IntegrityError as e:
      error_message = str(e)
      await consumer.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.CONSTRAINTS_VIOLATED,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : error_message
      })
      return
    except ValidationError as e:
      await consumer.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.VALIDATION_FAILED,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : e.error_dict
      })
      return

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : {
        message[WEBSOCKET_DATATYPE] : instances
      },
      WEBSOCKET_REFRESH : False,
    })

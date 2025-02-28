# Python standard library
from logging import getLogger

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import ERROR_LOGGER

from shared_constants import WEBSOCKET_MESSAGE_MODEL_EDIT,\
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH

from websocket.handler_base import HandlerBase

logger = getLogger(ERROR_LOGGER)

class HandleModelEdit(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_MODEL_EDIT

  async def __call__(self, consumer, message):
    """Primitive endpoint for editing a model

    Broadcasts the model if successful

    Args:
      message (Dict[str, Any]): message sent by the user
    """
    user = await get_user(consumer.scope)

    updatedModels = await consumer.db.handleEditModels(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA],
      user
    )

    if updatedModels is not None:
      customerIDs = await consumer.db.getCustomerIDs(updatedModels)
      await consumer._broadcastCustomer({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_DATA : { message[WEBSOCKET_DATATYPE] : updatedModels},
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_REFRESH : False
      }, customerIDs)
    else:
      logger.error(f"Edit update failed from message: {message} by {user}")
      await consumer.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_EDIT,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
      })

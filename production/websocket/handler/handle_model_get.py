# Python standard library
from logging import getLogger

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import ERROR_LOGGER, MESSENGER_CONSUMER
from lib.utils import classproperty
from database.models import MODELS
from shared_constants import \
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
   WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase

logger = getLogger(ERROR_LOGGER)

class HandleModelGet(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      WEBSOCKET_DATA : int,
      WEBSOCKET_DATATYPE : str
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_MODELS_GET

  async def __call__(self, consumer, message):
    """Primitive endpoint for editing a model

    Broadcasts the model if successful

    Args:
      message (Dict[str, Any]): message sent by the user
    """
    user = await get_logged_in_user(consumer.scope)

    try:
      Model = MODELS[message[WEBSOCKET_DATATYPE]]
    except KeyError:
      logger.error("User requested invalid model type")
      return

    read_models = await consumer.db.a_get_model(
      Model,
      message[WEBSOCKET_DATA],
    )

    if read_models is None:
      read_models = {}
      logger.error(f"GET update failed from message: {message} by {user}")
      success = SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT
    else:
      success = SUCCESS_STATUS_CRUD.SUCCESS

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      MESSENGER_CONSUMER : consumer,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : { message[WEBSOCKET_DATATYPE] : [read_models]},
      WEBSOCKET_MESSAGE_STATUS : success,
      WEBSOCKET_REFRESH : False
    })

# Python standard library

# Third party modules
from channels.auth import get_user

# Tracershop modules
from database.models import User
from lib.utils import classproperty
from lib.formatting import toDateTime
from shared_constants import WEBSOCKET_MESSAGE_GET_ORDERS,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_REFRESH,\
  WEBSOCKET_DATE, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase

class HandleGetTimeSensitiveData(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      WEBSOCKET_DATE : str,
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_GET_ORDERS

  async def __call__(self, consumer, message):
    user: User = await get_logged_in_user(consumer.scope)
    client_date = toDateTime(message[WEBSOCKET_DATE][:19])
    data = await consumer.db.getTimeSensitiveData(client_date, user)

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_STATE, {
      "consumer" : consumer,
      "message_id" : message[WEBSOCKET_MESSAGE_ID],
      "status" : SUCCESS_STATUS_CRUD.SUCCESS,
      "data" : data,
      "refresh" : True
    })

    await consumer.send_json({
      WEBSOCKET_DATA : data,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_REFRESH : True,
    })
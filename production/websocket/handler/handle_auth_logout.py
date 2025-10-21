# Python Standard library
from asgiref.sync import sync_to_async

# Django / Channels Imports
from channels.auth import get_user, logout

# Tracershop imports
from database.models import User
from lib.utils import classproperty
from constants import MESSENGER_CONSUMER
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_MESSAGE_AUTH_LOGOUT,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPES, WEBSOCKET_SERVER_MESSAGES

from websocket.handler_base import HandlerBase

class HandleLogOut(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({ })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_AUTH_LOGOUT

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope) #type: ignore
    if isinstance(user, User):
      await consumer.leaveUserGroups(user)
      await logout(consumer.scope)
      scope_session = consumer.scope.get('session')
      if scope_session:
        await sync_to_async(scope_session.save)()
    await consumer.messenger(
      WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_LOGOUT, {
        MESSENGER_CONSUMER : consumer,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      })

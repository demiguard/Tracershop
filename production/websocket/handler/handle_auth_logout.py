# Python Standard library
from asgiref.sync import sync_to_async

# Django / Channels Imports
from channels.auth import get_user, logout
# Tracershop imports

from shared_constants import WEBSOCKET_MESSAGE_AUTH_LOGOUT,\
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_SUCCESS

from websocket.handler_base import HandlerBase

class HandleLogOut(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_AUTH_LOGOUT

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope)
    await consumer.leaveUserGroups(user)
    await logout(consumer.scope)
    await sync_to_async(consumer.scope['session'].save)()
    await consumer.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

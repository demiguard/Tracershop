# Python Standard Library

# Third party packages
from shared_constants import WEBSOCKET_MESSAGE_ECHO, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_SUCCESS

from websocket.handler_base import HandlerBase

class HandleEcho(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_ECHO

  async def __call__(self, consumer, message):
    await consumer.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

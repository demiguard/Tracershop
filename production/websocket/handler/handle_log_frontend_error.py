# Python standard library
from logging import getLogger

# Third party modules
from channels.auth import get_user

# Tracershop modules
from constants import ERROR_LOGGER
from lib.formatting import formatFrontendErrorMessage
from shared_constants import WEBSOCKET_MESSAGE_LOG_ERROR, WEBSOCKET_MESSAGE_ERROR
from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)

class HandleLogFrontendError(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_LOG_ERROR

  async def __call__(self, consumer, message):
    user = await get_user(consumer.scope)
    formatted_error = formatFrontendErrorMessage(message[WEBSOCKET_MESSAGE_ERROR])
    error_logger.error(
      f"User: {user} encountered critical error: {formatted_error}"
    )
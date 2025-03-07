# Python standard library

# Third party modules

# Tracershop modules
from shared_constants import WEBSOCKET_MESSAGE_TYPES
from lib.utils import classproperty
from websocket.handler_base import HandlerBase

class HandleTestPrinter(HandlerBase):

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_TEST_PRINTER

  async def __call__(self, consumer, message):
    pass
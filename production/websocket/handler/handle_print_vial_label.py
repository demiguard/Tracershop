# Python standard library
# Third party modules

# Tracershop modules
from lib.printing import schedule_vial_print
from lib.utils import classproperty
from shared_constants import DATA_VIAL, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPES
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase


class HandleTestPrinter(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
        WEBSOCKET_DATA : {
            DATA_VIAL : int,
        }
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_PRINT_VIAL

  async def __call__(self, consumer, message):
    await schedule_vial_print(message[WEBSOCKET_DATA][DATA_VIAL])

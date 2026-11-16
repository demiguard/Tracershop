# Python standard library

# Third party modules

from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from channels.db import database_sync_to_async

# Tracershop modules
from database.TracerShopModels.customerModels import Vial
from database.TracerShopModels.serverModels import ServerConfiguration, VialTemplate
from lib.printing import print_document
from lib.rendering import render_vial_template
from lib.utils import classproperty
from shared_constants import DATA_VIAL, DATA_VIAL_TEMPLATE, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPES
from tracerauth.message_validation import Message
from websocket.handler_base import HandlerBase

@database_sync_to_async
def get_vial_and_template(vial_id: int, vial_template_id: int):
  vial = Vial.objects.get(id=vial_id)
  template = VialTemplate.objects.get(id=vial_template_id)
  server_config = ServerConfiguration.get()



  return vial, template, server_config.active_printer

class HandleTestPrinter(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
        WEBSOCKET_DATA : {
            DATA_VIAL : int,
            DATA_VIAL_TEMPLATE : int
        }
    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_PRINT_DOCUMENT

  async def __call__(self, consumer, message):
    try:
      vial, template, active_printer = await get_vial_and_template(
        message[WEBSOCKET_DATA][DATA_VIAL],
        message[WEBSOCKET_DATA][DATA_VIAL_TEMPLATE]
      )

    except ObjectDoesNotExist:
      print("Handle this later")
      return

    if active_printer is None:
      print("No active printer!")


    await sync_to_async(print_document)(vial, active_printer, template, 1)

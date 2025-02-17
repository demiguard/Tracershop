# Python standard library
from logging import getLogger
import subprocess

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import AUDIT_LOGGER, ERROR_LOGGER

from shared_constants import WEBSOCKET_MESSAGE_TEST_PRINTER

from websocket.handler_base import HandlerBase

class HandleTestPrinter(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_TEST_PRINTER

  async def __call__(self, consumer, message):
    pass
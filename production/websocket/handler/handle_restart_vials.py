# Python standard library
from logging import getLogger
import subprocess

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import AUDIT_LOGGER, ERROR_LOGGER

from database.models import User
from shared_constants import WEBSOCKET_MESSAGE_RESTART_VIAL_DOG,\
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA, SUCCESS_STATUS_CRUD,\
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS,\
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,\
  WEBSOCKET_REFRESH

from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)
audit_logger = getLogger(AUDIT_LOGGER)


class HandleRestartVials(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_RESTART_VIAL_DOG

  async def __call__(self, consumer, message):
    user: User = await get_user(consumer.scope)

    if user.is_production_member:
      try:
        subprocess.call(['sudo', 'systemctl', 'restart', 'vialdog'], timeout=1.0)
      except Exception:
        error_logger.error("Web service is not setup in sudoers!")
      audit_logger.info(f"user: {user.username} restarted the vial dog")

  # No response?
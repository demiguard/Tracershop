# Python standard library
from logging import getLogger
import subprocess

# Third party modules
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from channels.auth import get_user

# Tracershop modules
from constants import AUDIT_LOGGER, ERROR_LOGGER
from lib.utils import classproperty
from database.models import User
from tracerauth.auth import get_logged_in_user
from tracerauth.message_validation import Message
from shared_constants import WEBSOCKET_MESSAGE_TYPES
from websocket.handler_base import HandlerBase

error_logger = getLogger(ERROR_LOGGER)
audit_logger = getLogger(AUDIT_LOGGER)

class HandleRestartVials(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({

    })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_RESTART_VIAL_DOG

  async def __call__(self, consumer, message):
    user: User = await get_logged_in_user(consumer.scope)

    if user.is_production_member:
      try:
        subprocess.call(['sudo', 'systemctl', 'restart', 'vialdog'], timeout=1.0)
      except Exception:
        error_logger.error("Web service is not setup in sudoers!")
      audit_logger.info(f"user: {user.username} restarted the vial dog")

  # No response?
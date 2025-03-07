# Python Standard library
from asgiref.sync import sync_to_async
from logging import getLogger

# Django / Channels Imports
from channels.db import database_sync_to_async
from channels.auth import get_user, login

from django.contrib.auth.models import AnonymousUser

# Tracershop imports
from database.models import User, UserGroups, SuccessfulLogin
from constants import DEBUG_LOGGER
from lib.utils import classproperty
from shared_constants import WEBSOCKET_MESSAGE_TYPES,\
  DATA_USER

from tracerauth import auth
from websocket.handler_base import HandlerBase

logger = getLogger(DEBUG_LOGGER)

class HandleAuthWhoAmI(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_AUTH_WHOAMI

  async def __call__(self, consumer, message):
    now = consumer.datetimeNow.now()
    user = await get_user(consumer.scope)
    if isinstance(user, User):
      logger.info(f"WhoAmI message found: {user} from session cookie")
      await consumer.enterUserGroups(user)
      if user.user_group == UserGroups.ShopExternal:
        logins = await database_sync_to_async(SuccessfulLogin.objects.filter)(user=user)
        await database_sync_to_async(logins.delete)()
      return await consumer.respond_auth_message(message, True, {DATA_USER : [user]}, consumer.scope["session"].session_key)
    elif isinstance(user, AnonymousUser):
      user = await database_sync_to_async(auth.get_login)(now)
      logger.info(f"Found user:{user} from external users")
      if not isinstance(user, AnonymousUser):
        await login(consumer.scope, user, backend='tracerauth.backend.TracershopAuthenticationBackend')
        session = consumer.scope["session"]
        await database_sync_to_async(session.save)()
        await consumer.enterUserGroups(user)
        session_key = consumer.scope["session"].session_key
        return await consumer.respond_auth_message(message,
                                                True,
                                                {DATA_USER : [user]},
                                                session_key)
    await consumer.respond_reject_auth_message(message)

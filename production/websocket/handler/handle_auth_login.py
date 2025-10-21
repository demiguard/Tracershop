# Python Standard library
from asgiref.sync import sync_to_async
from typing import Any, Dict

# Django / Channels Imports
from channels.auth import login
from channels.db import database_sync_to_async
from django.contrib.auth import aauthenticate

# Tracershop imports
from database.models import User, UserGroups
from shared_constants import WEBSOCKET_MESSAGE_TYPES,\
  DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD, DATA_USER
from tracerauth.message_validation import Message
from lib.utils import classproperty
from tracerauth.tracer_ldap import checkUserGroupMembership
from websocket import consumer
from websocket.handler_base import HandlerBase

class HandleAuthLogin(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
    DATA_AUTH : {
      AUTH_USERNAME : str,
      AUTH_PASSWORD : str
    }
  })

  @classproperty
  def message_type(cls):
   return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_AUTH_LOGIN

  async def __call__(self, consumer: consumer.Consumer, message: Dict[str, Any]):
    auth = message[DATA_AUTH]
    username = auth[AUTH_USERNAME]
    password = auth[AUTH_PASSWORD]
    user = await aauthenticate(username=username, password=password)
    if isinstance(user, User):
      if user.user_group == UserGroups.Anon:
        success, newUserGroup = checkUserGroupMembership(user.username)
        if newUserGroup is not None:
          user.user_group = newUserGroup
          await database_sync_to_async(user.save)()
      await login(consumer.scope, user)
      scope_session = consumer.scope.get("session")
      if scope_session is not None:
        await sync_to_async(scope_session.save)()

        await consumer.enterUserGroups(user)
        scope_session = consumer.scope.get("session") # Refresh the scope
        if scope_session is not None:
          return await consumer.respond_auth_message(message,
                                             True,
                                             {DATA_USER : [user]},
                                             scope_session.session_key)
    return await consumer.respond_reject_auth_message(message)

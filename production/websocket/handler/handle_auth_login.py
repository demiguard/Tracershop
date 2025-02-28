# Python Standard library
from asgiref.sync import sync_to_async

# Django / Channels Imports
from channels.auth import login
from channels.db import database_sync_to_async
from django.contrib.auth import aauthenticate

# Tracershop imports
from database.models import User, UserGroups

from shared_constants import WEBSOCKET_MESSAGE_AUTH_LOGIN,\
  DATA_AUTH, AUTH_USERNAME, AUTH_PASSWORD, DATA_USER

from tracerauth.ldap import checkUserGroupMembership

from websocket.handler_base import HandlerBase

class HandleAuthLogin(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_AUTH_LOGIN

  async def __call__(self, consumer, message):
    auth = message[DATA_AUTH]
    username = auth[AUTH_USERNAME]
    password = auth[AUTH_PASSWORD]
    user: User = await aauthenticate(username=username, password=password)
    if user:
      if user.user_group == UserGroups.Anon:
        success, newUserGroup = checkUserGroupMembership(user.username)
        if newUserGroup is not None or UserGroups.Anon:
          user.user_group = newUserGroup
          await database_sync_to_async(user.save)()
      await login(consumer.scope, user)
      await sync_to_async(consumer.scope["session"].save)()
      await consumer.enterUserGroups(user)
      return await consumer.respond_auth_message(message,
                                             True,
                                             {DATA_USER : [user]},
                                             consumer.scope["session"].session_key)
    return await consumer.respond_reject_auth_message(message)

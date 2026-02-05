"""Module containing function for handling IT security aspects of message
handling
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import datetime, timedelta
from enum import Enum
from logging import getLogger
from typing import Any, Dict, Optional, Tuple,  Type

# Third party Libraries
from django.core.signing import Signer, BadSignature
from django.core.exceptions import ObjectDoesNotExist
from django.http.request import HttpRequest
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import AnonymousUser, AbstractBaseUser
from channels.auth import get_user

# Tracershop App
from tracerauth.message_validation import Message, validate_message
from database.models import User
from core.exceptions import LoginRequired, ContractBroken
from constants import ERROR_LOGGER, DEBUG_LOGGER
from lib.parsing import parse_index_header
from shared_constants import WEBSOCKET_JAVASCRIPT_VERSION,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_TYPE,\
  WEBSOCKET_MESSAGE_TYPES, JAVASCRIPT_VERSION, MessageValidationResult
from database.models import User, UserGroups, SuccessfulLogin
from tracerauth.types import AuthenticationResult

error_logger = getLogger(ERROR_LOGGER)
debug_logger = getLogger(DEBUG_LOGGER)

def authenticate_user(username: str,
                      password: str,
                      logged_in_user: Optional[User]=None,
                      request: Optional[HttpRequest]=None
                     ) -> Tuple[AuthenticationResult, Optional[User]]:
  user = authenticate(request=request, username=username, password=password)

  if user is None:
    return AuthenticationResult.INVALID_PASSWORD, None


  if logged_in_user is not None and user != logged_in_user:
    return AuthenticationResult.MISS_MATCH_USERNAME, None

  if isinstance(user, User):
    return AuthenticationResult.SUCCESS, user
  else:
    raise ContractBroken("For some reason, the user was not of the User class")


def login_from_header(request: HttpRequest) -> bool:
  """Login the user from the http header

  Args:
      request (django.http.HttpRequest): The http request generated for the
      index view

  Returns:
      bool: if authentication was successful.
  """
  """ I kinda want to explain how this works.
  At the time this function gets called, the user have already been verified by
  the F5. So they send a username and a user-group with 1-5, or Nothing.

  Nothing appears if the F5 didn't authorize the user, but tracershop did.

  The way this happens is that when an external user successfully authenticate
  itself, a database record of the event is created. The IP address of
  the user is not forwarded, only the IP address of the F5, which is useless.
  """

  if 'X-Tracer-User' in request.headers and 'X-Tracer-Role' in request.headers:
    header_user_group, header_user_name = parse_index_header(
      request.headers #type: ignore
    )

    if header_user_group == UserGroups.ShopExternal:
      # Note that username is not parsed so we have to get creative
      # Also this is very insecure... ffs
      _login_from_header_external_user(request)
    elif header_user_group == UserGroups.Anon:
      return False
    else:
      _login_from_header_internal_user(request, header_user_group, header_user_name)
    return True
  else:
    return False

def _login_from_header_internal_user(request: HttpRequest,
                                     user_group : UserGroups,
                                     username : str) -> None:
  try:
    user = User.objects.get(username=username)
    if user.user_group != user_group:
      user.user_group = user_group
      user.save()
  except ObjectDoesNotExist:
    user = User.objects.create(username=username,
                          user_group=user_group)
  login(request, user, backend="django_auth_ldap.backend.LDAPBackend")

def _login_from_header_external_user(request: HttpRequest) -> None:
  """This function doesn't nothing because the login happens from "who am i"
  message send by websocket on login.

  Args:
      request (HttpRequest): _description_
  """

  if 'auth' in request.COOKIES:
    signer = Signer()
    signed_username = request.COOKIES.get('auth')
    if signed_username is not None:
      try:
        username = signer.unsign(signed_username)
        user = User.objects.get(username=username)
        login(request, user, backend="tracerauth.backend.TracershopAuthenticationBackend")
        return
      except BadSignature:
        pass

  user = get_login()
  if user:
    login(request, user, backend="tracerauth.backend.TracershopAuthenticationBackend")
  return None


# this is placed bad
def get_login(now=None) -> Optional[AbstractBaseUser] :
  if now is None: # pragma: no cover
    now = datetime.now()

  window_bound_seconds = 5
  valid_window_lower_bound = now - timedelta(0, seconds=window_bound_seconds)
  valid_window_upper_bound = now

  debug_logger.info(f"lower:{valid_window_lower_bound}, upper: {valid_window_upper_bound}")

  query = SuccessfulLogin.objects.filter(
    login_time__range=[valid_window_lower_bound,valid_window_upper_bound]
  )

  if query.exists():
    successful_login = query[0]
    user = successful_login.user
    successful_login.delete()
    return user
  else:
    return None


async def get_logged_in_user(scope):
  user = await get_user(scope)

  if isinstance(user, AnonymousUser):
    raise LoginRequired("Action requires the user to be logged in")

  if not isinstance(user, User): # pragma: no cover
    raise ContractBroken("Returned a user that wasn't a Tracershop user class")

  return user


_BaseMessage = Message({
  WEBSOCKET_MESSAGE_ID : int,
  WEBSOCKET_JAVASCRIPT_VERSION : str,
  WEBSOCKET_MESSAGE_TYPE : str
})

def validate_unknown_message(message : Dict[str, Any]):
  if not validate_message(message, _BaseMessage):
    return MessageValidationResult.MissingField

  if message[WEBSOCKET_JAVASCRIPT_VERSION] != JAVASCRIPT_VERSION:
    return MessageValidationResult.JavascriptVersionMismatch

  if message[WEBSOCKET_MESSAGE_TYPE] not in WEBSOCKET_MESSAGE_TYPES:
    return MessageValidationResult.InvalidMessageType

  return MessageValidationResult.Successful

__all__ = [
  'get_logged_in_user',
  'validate_unknown_message',
  'get_login',
  'login_from_header',
  'authenticate_user'
]

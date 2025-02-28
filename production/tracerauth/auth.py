"""Module containing function for handling IT security aspects of message
handling
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from datetime import datetime, timedelta
from logging import getLogger
from typing import Any, Dict, Optional, Tuple,  Type

# Third party Libraries
from django.core.signing import Signer, BadSignature
from django.core.exceptions import ObjectDoesNotExist
from django.http.request import HttpRequest
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import AnonymousUser, AbstractBaseUser

# Tracershop App
from constants import ERROR_LOGGER, DEBUG_LOGGER
from lib.formatting import toDate
from lib.parsing import parse_index_header
from lib.utils import identity
from shared_constants import AUTH_PASSWORD, AUTH_USERNAME,\
  ERROR_INSUFFICIENT_DATA, ERROR_INVALID_JAVASCRIPT_VERSION,\
  ERROR_NO_MESSAGE_TYPE, ERROR_INVALID_MESSAGE_TYPE, ERROR_NO_JAVASCRIPT_VERSION,\
  ERROR_NO_MESSAGE_ID, WEBSOCKET_JAVASCRIPT_VERSION, ERROR_INVALID_MESSAGE,\
  ERROR_INVALID_AUTH, DATA_AUTH, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_ID,\
  WEBSOCKET_MESSAGE_AUTH_LOGIN, WEBSOCKET_MESSAGE_FREE_INJECTION,\
  WEBSOCKET_MESSAGE_GET_STATE, WEBSOCKET_DATATYPE,\
  WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_EDIT,\
  WEBSOCKET_MESSAGE_TYPE, NO_ERROR, WEBSOCKET_DATE,\
  WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_MODEL_CREATE,\
  WEBSOCKET_MESSAGE_MASS_ORDER, WEBSOCKET_MESSAGE_RESTORE_ORDERS,\
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD, WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,\
  WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI, WEBSOCKET_MESSAGE_ECHO,\
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_CORRECT_ORDER,\
  WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_GET_ORDERS,\
  WEBSOCKET_MESSAGE_TYPES, JAVASCRIPT_VERSION
from database.models import User, UserGroups, SuccessfulLogin

from tracerauth.types import MessageType, MessageField, MessageObjectField,\
  Message, AuthenticationResult

error_logger = getLogger(ERROR_LOGGER)
debug_logger = getLogger(DEBUG_LOGGER)

requiredMessageFields = {
  WEBSOCKET_MESSAGE_AUTH_LOGIN : [DATA_AUTH],
  WEBSOCKET_MESSAGE_FREE_INJECTION : [WEBSOCKET_DATA, DATA_AUTH],
  WEBSOCKET_MESSAGE_GET_STATE : [],
  WEBSOCKET_MESSAGE_MODEL_DELETE : [WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE],
  WEBSOCKET_MESSAGE_MODEL_EDIT : [WEBSOCKET_DATA, WEBSOCKET_DATATYPE],
  WEBSOCKET_MESSAGE_MODEL_CREATE : [WEBSOCKET_DATA, WEBSOCKET_DATATYPE],
}

MESSAGE_TYPES = {
  WEBSOCKET_MESSAGE_AUTH_LOGIN : MessageType(WEBSOCKET_MESSAGE_AUTH_LOGIN, [
    MessageObjectField(DATA_AUTH, [
      MessageField(AUTH_USERNAME, str),
      MessageField(AUTH_PASSWORD, str),
    ])
  ]),
  WEBSOCKET_MESSAGE_AUTH_LOGOUT : MessageType(WEBSOCKET_MESSAGE_AUTH_LOGOUT, []),
  WEBSOCKET_MESSAGE_AUTH_WHOAMI : MessageType(WEBSOCKET_MESSAGE_AUTH_WHOAMI, []),

  WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT : MessageType(WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT, []), # This function is not done?
  WEBSOCKET_MESSAGE_ECHO : MessageType(WEBSOCKET_MESSAGE_ECHO, []),
  WEBSOCKET_MESSAGE_GET_ORDERS : MessageType(WEBSOCKET_MESSAGE_GET_ORDERS, [
    MessageField(WEBSOCKET_DATE, toDate, required=True)
  ]),
  WEBSOCKET_MESSAGE_GET_STATE : MessageType(WEBSOCKET_MESSAGE_GET_STATE, [
    MessageField(WEBSOCKET_DATE, toDate, required=False)
  ]),
  WEBSOCKET_MESSAGE_FREE_ACTIVITY : MessageType(WEBSOCKET_MESSAGE_FREE_ACTIVITY, []),
  WEBSOCKET_MESSAGE_FREE_INJECTION : MessageType(WEBSOCKET_MESSAGE_FREE_INJECTION, []),
  WEBSOCKET_MESSAGE_MODEL_CREATE : MessageType(WEBSOCKET_MESSAGE_MODEL_CREATE, []),
  WEBSOCKET_MESSAGE_MODEL_DELETE : MessageType(WEBSOCKET_MESSAGE_MODEL_DELETE, []),
  WEBSOCKET_MESSAGE_MODEL_EDIT : MessageType(WEBSOCKET_MESSAGE_MODEL_EDIT, []),
  WEBSOCKET_MESSAGE_MASS_ORDER : MessageType(WEBSOCKET_MESSAGE_MASS_ORDER, [
    MessageField(WEBSOCKET_DATA, identity)
  ]),
  WEBSOCKET_MESSAGE_MOVE_ORDERS : MessageType(WEBSOCKET_MESSAGE_MOVE_ORDERS, []),
  WEBSOCKET_MESSAGE_RESTORE_ORDERS : MessageType(WEBSOCKET_MESSAGE_RESTORE_ORDERS, []),
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD : MessageType(WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD, []),
  WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER : MessageType(WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER, []),
  WEBSOCKET_MESSAGE_CORRECT_ORDER : MessageType(
    WEBSOCKET_MESSAGE_CORRECT_ORDER, [
      MessageObjectField(DATA_AUTH, [
        MessageField(AUTH_USERNAME, str),
        MessageField(AUTH_PASSWORD, str),
      ]),
      MessageObjectField(WEBSOCKET_DATA, [

      ])
    ]
  )
}

requiredDataFields = {
  WEBSOCKET_MESSAGE_FREE_INJECTION : [(WEBSOCKET_DATA_ID, int), ('lot_number', str)]
}


def ValidateAuthObject(AuthObj: Dict) -> bool:
  """Validates that the auth object contains a username and password

  Username name might not exists and if it does password may not be correct.

  Args:
      message (Dict): An object that should contain AUTH_USERNAME and AUTH_PASSWORD

  Returns:
      bool: Validity of Auth object
  """
  # Auth object should always contain a username and a password
  return AUTH_USERNAME in AuthObj and AUTH_PASSWORD in AuthObj

def ValidateType(value : Any, targetType: Type) -> bool:
  """Checks if a value is of a certain type

  Args:
      value (_type_): _description_
      targetType (_type_): _description_

  Returns:
      bool: _description_
  """

  return True

def AuthMessage(user: User, message: Dict) -> bool:
  """Check if a user is allowed to send a message

  Args:
      user (User): _description_
      messageType (str): _description_

  Returns:
      bool: If the user is allowed to handle such a message
  """
  messageType = message[WEBSOCKET_MESSAGE_TYPE]
  return True


def validateMessage(message: Dict) -> str:
  """Checks is a message contains the correct fields to be a valid message.
  Note a valid message is returned as falsy, while a truthy indicate an error.

  Note that this function should not be used

  Args:
      message (Dict): The message to be validated

  Returns:
      str: empty if valid otherwise a ERROR_XXX from constants.py is returned
  """
  if not message.get(WEBSOCKET_MESSAGE_ID):
    return ERROR_NO_MESSAGE_ID
  if not message.get(WEBSOCKET_MESSAGE_TYPE):
    return ERROR_NO_MESSAGE_TYPE
  if not message[WEBSOCKET_MESSAGE_TYPE] in WEBSOCKET_MESSAGE_TYPES:
    return ERROR_INVALID_MESSAGE_TYPE
  if not message.get(WEBSOCKET_JAVASCRIPT_VERSION):
    return ERROR_NO_JAVASCRIPT_VERSION
  if not message[WEBSOCKET_JAVASCRIPT_VERSION] == JAVASCRIPT_VERSION:
    return ERROR_INVALID_JAVASCRIPT_VERSION

  message_type = message[WEBSOCKET_MESSAGE_TYPE]

  #if message_type not in requiredMessageFields:
  #  error_logger.warning(f"Message type: {message_type} is not in Require Message Fields")

  for field in requiredMessageFields.get(message_type, []):
    if field not in message:
      error_logger.error(f"Missing {field} in f{message}")
      return ERROR_INVALID_MESSAGE

  if WEBSOCKET_DATA in message:
    data = message[WEBSOCKET_DATA]
    for field, Type in requiredDataFields.get(message_type, []):
      if field not in data or not ValidateType(data[field], Type):
        return ERROR_INSUFFICIENT_DATA

  if DATA_AUTH in message and not ValidateAuthObject(message[DATA_AUTH]):
    return ERROR_INVALID_AUTH

  return NO_ERROR


def authenticate_user(username: str,
                      password: str,
                      logged_in_user: Optional[User]=None,
                      request: Optional[HttpRequest]=None
                     ) -> Tuple[AuthenticationResult, Optional[User]]:
  if logged_in_user and logged_in_user.username.upper() != username.upper():
    return AuthenticationResult.MISS_MATCH_USERNAME, None

  user = authenticate(request=request, username=username, password=password)
  if user:
    return AuthenticationResult.SUCCESS, user
  else:
    return AuthenticationResult.INVALID_PASSWORD, None

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
      request.headers
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
    try:
      username = signer.unsign(request.COOKIES.get('auth'))
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
def get_login(now=None) -> AbstractBaseUser:
  if now is None: # pragma: no cover
    now = datetime.now()

  window_bound_seconds = 5
  valid_window_lower_bound = now - timedelta(0, window_bound_seconds)
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
    return AnonymousUser()

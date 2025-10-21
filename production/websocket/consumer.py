"""This module contains the Websocket that handles ALL communication between the server and the client!

Namely the Consumer Class.

The Consumer class has a DatabaseInterface which is responsible for all communication with database

Note: This module doesn't scale at large, simply because all users are in
 a single group. So it should not surprise anybody if stuff starts to break
 if Tracershop starts to scale.
"""
__author__ = "Christoffer Vilstrup Jensen"


# Python standard Library
import logging
from pprint import pformat
import traceback
import time as time_module
from typing import Any, Dict, List, Optional, Tuple

# Django packages
from channels.db import database_sync_to_async
from channels.auth import get_user
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels_redis.core import RedisChannelLayer
from django.contrib.auth.models import AnonymousUser
from django.conf import settings

# Tracershop Production packages
from core.side_effect_injection import DateTimeNow
from core.exceptions import IllegalActionAttempted
from constants import DEBUG_LOGGER, ERROR_LOGGER,\
    CHANNEL_GROUP_GLOBAL, AUDIT_LOGGER, MESSENGER_CONSUMER

from shared_constants import AUTH_PASSWORD, DATA_USER, AUTH_USERNAME, AUTH_IS_AUTHENTICATED, \
    ERROR_INSUFFICIENT_PERMISSIONS,ERROR_UNKNOWN_FAILURE, ERROR_TYPE, NO_ERROR,\
    DATA_AUTH, WEBSOCKET_SESSION_ID,WEBSOCKET_MESSAGE_STATUS, \
    WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_SUCCESS,\
    WEBSOCKET_MESSAGE_TYPE, SUCCESS_STATUS_CRUD, WEBSOCKET_SERVER_MESSAGES,\
    WEBSOCKET_DATA, WEBSOCKET_REFRESH

from database.database_interface import DatabaseInterface
from database.TracerShopModels.telemetry_models import TelemetryRecordStatus
from database.telemetry import create_telemetry_record
from database.models import User, UserGroups
from lib.serialization import a_serialize_redis
from lib.ProductionJSON import encode, decode
from tracerauth import auth
from tracerauth.types import AuthenticationResult
from websocket import messenger
from websocket import handler

logger = logging.getLogger(DEBUG_LOGGER)
error_logger = logging.getLogger(ERROR_LOGGER)
audit_logger = logging.getLogger(AUDIT_LOGGER)


class Consumer(AsyncJsonWebsocketConsumer):
  """This is the websocket that communicates with all clients.

  The most import method is the receive_json method,
  which is called when a websocket receives message on the json format.
  Any message not on the json format is invalid!
  receive_json calls a handler found Handlers property at the end of the file.

  Programmers Note:
   Communication with all clients are needed because the client might cause updates that all clients are need to be aware of.
   Because of the low user count this is ok.
  """
  global_group = CHANNEL_GROUP_GLOBAL
  channel_layer: RedisChannelLayer #


  def __init__(self, db = DatabaseInterface(), datetimeNow = DateTimeNow()):
    super().__init__()
    self.handler = handler.MessageHandler()
    self.messenger = messenger.Messenger()
    self.db = db
    self.datetimeNow = datetimeNow

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, content: Dict) -> str:
    data = await a_serialize_redis(content)

    return encode(data)

  @classmethod
  async def decode_json(cls, text_data: str) -> Dict:
    return decode(text_data)

  async def enterUserGroups(self, user: User):
    if isinstance(user, AnonymousUser):
      return

    if user.user_group in [UserGroups.Admin, UserGroups.ProductionAdmin, UserGroups.ProductionUser]:
      await self.channel_layer.group_add('production', self.channel_name)
    if user.user_group in [UserGroups.ShopAdmin, UserGroups.ShopExternal, UserGroups.ShopUser]:
      customerIDs: List[int] = await self.db.getRelatedCustomerIDs(user)
      for customerID in customerIDs:
        await self.channel_layer.group_add(f'customer_{customerID}', self.channel_name)


  async def leaveUserGroups(self, user: User):
    if isinstance(user, AnonymousUser):
      return

    if user.user_group in [UserGroups.Admin, UserGroups.ProductionAdmin, UserGroups.ProductionUser]:
      await self.channel_layer.group_discard('production', channel=self.channel_name)
    if user.user_group in [UserGroups.ShopAdmin, UserGroups.ShopExternal, UserGroups.ShopUser]:
      customerIDs: List[int] = await self.db.getRelatedCustomerIDs(user)
      for customerID in customerIDs:
        await self.channel_layer.group_discard(f'customer_{customerID}', channel=self.channel_name)

  ### --- Websocket methods --- ####
  async def connect(self):
    """Method called when a user connect"""
    await self.channel_layer.group_add(self.global_group, self.channel_name)
    user = await get_user(self.scope)
    await self.enterUserGroups(user)
    await self.accept()
    logger.debug(f"{user} connected!")

  async def disconnect(self, code):
    user = await get_user(self.scope)
    await self.leaveUserGroups(user)
    await self.channel_layer.group_discard(self.global_group, self.channel_name)
    logger.debug(f"{user} disconnected!")


  async def _prepBroadcastMessage(self, message: Dict[str, Any]) -> Dict:
    if 'type' not in message:
      message['type'] = "broadcastMessage" # This is needed to point it to the send place

    if WEBSOCKET_MESSAGE_SUCCESS not in message:
      message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS

    return await a_serialize_redis(message)


  async def broadcastGlobal(self, message: Dict):
    """Broadcast a message to all connected users

    Args:
        message (Dict): Message to be broadcast
    """
    message = await self._prepBroadcastMessage(message)
    await self.channel_layer.group_send(self.global_group, message)


  async def broadcastProduction(self, message: Dict):
    """Broadcast only to the group production

    Args:
        message (Dict): Message to be send
    """
    message = await self._prepBroadcastMessage(message)
    await self.channel_layer.group_send('production', message) #


  async def broadcastCustomer(self, message: Dict, customerIDs: Optional[List[int]]):
    message = await self._prepBroadcastMessage(message)
    if customerIDs is None:
      await self.broadcastGlobal(message)
      return

    await self.broadcastProduction(message)
    for customerID in customerIDs:
      await self.channel_layer.group_send(f'customer_{customerID}', message)


  async def broadcastMessage(self, message: Dict):
    """WARNING: IS THIS A PRIVATE HELPER FUNCTION THAT YOU SHOULDN'T CALL IN
    HANDLER FUNCTIONS. Use _broadcastGlobal instead!

    Send the event to each subscriber of the websocket channel.
    Note this function gets call for each websocket connected to the group

    This function is called by _broadcast

    Note that this function CANNOT be named with leading underscore due to
    constraints made by channels
    """
    await self.send_json(message)


  #Receive data from Websocket
  async def receive_json(self, content: Dict, **kwargs) -> None:
    """This is the server side handler for new message.
    This function should be handler that just Detects the message and then proceeds
    to hand the function to Another handler function.

    Programmer Note:
      So these handler functions should be refactored such that they call a sub method,
      for all the processing and then just returns the message. Because such a thing is actually testable :)

      Programmer Note to Programmer note:
        It is end-2-end testable.

      Args:
        message - Dict - the json message converted into a python dictionary
                         It has the a message type field and also additional fields
                         needed to handle that message
    """
    time_start_ns = time_module.monotonic_ns()
    user: User = await get_user(self.scope)

    try:
      error = auth.validateMessage(content)
      if error != NO_ERROR:
        error_logger.error(f"Handling an invalid message {content}")
        error_logger.error(f"With error code: {error}")
        await self.RespondWithError(content, {ERROR_TYPE : error})
        return

      logger.info(f"Websocket received message: {content[WEBSOCKET_MESSAGE_ID]} - {content[WEBSOCKET_MESSAGE_TYPE]}")
      if not auth.AuthMessage(user, content): #pragma: no cover
        logger.info(f"Insufficient Rights for {user}!")
        await self.RespondWithError(content, {ERROR_TYPE : ERROR_INSUFFICIENT_PERMISSIONS})
        return

      await self.handler(self, content)
      time_end_ns = time_module.monotonic_ns()
      latency_ms = (time_end_ns - time_start_ns) / 1_000_000 # factor a million between ms and ns
      await create_telemetry_record(content[WEBSOCKET_MESSAGE_TYPE], latency_ms, TelemetryRecordStatus.SUCCESS)

    except IllegalActionAttempted: #pragma: no cover
      error_logger.critical(pformat(
        f"user: {user} send the message {pformat(content)} which contains an "
         "action witch the system detected as Illegal, either we got a pen "
         "tester, a bad actor or a frontend error."
        ))
    except Exception as E: # pragma: no cover
      # Very broad catch here, to prevent a hanging message on the client side
      await self.HandleUnknownError(E, content)
      time_end_ns = time_module.monotonic_ns()
      latency_ms = (time_end_ns - time_start_ns) / 1_000_000 # factor a million between ms and ns
      await create_telemetry_record(content[WEBSOCKET_MESSAGE_TYPE], latency_ms, TelemetryRecordStatus.FAILURE)

  ### Error handling ###
  async def HandleUnknownError(self,
                               exception : Exception,
                               FailingMessage : dict): #pragma no cover
    """
    This Function is triggered when an unhandled exception is happens server side.
    It sends an Error message back to the client informing it,
    that server was unable to process the request, due to some unknown bug.
    The intent of this function is better displays bugs to the user, so that they can be fixed.

    Regarding security concerns of displaying code, this project is open source.

    Args:
        exception (Exception): _description_
        FailingMessage : dict
    """
    error_logger.error(f"Message {FailingMessage} Failed with Exception {exception} ")
    exceptionTraceback = traceback.format_exc()
    error_logger.error("Traceback:")
    error_logger.error(exceptionTraceback)
    # If a test case reaches here It should be a known error and either handled or thrown back to the websocket
    if settings.DEBUG:
      print(exceptionTraceback)

    await self.RespondWithError(FailingMessage, {
      ERROR_TYPE : ERROR_UNKNOWN_FAILURE
    }) # pragma: cover


  async def RespondWithError(self, message: Dict, error: Dict):
    """Informs the client of a programmatic error(s)
    This is only called in an emergency, ie it should be impossible to reach
    with normal operation.

    Args:
        message (Dict): The Original Message
        error (Dict): An Dictionary with errors codes to inform the frontend
    """
    # While I appreciate the idea to classify errors: all i have to say is: Wut?
    # An exceptional error is an error that shouldn't be able to happen.
    # An exceptional error is a reference to an non existing database object
    # An exceptional error is a order to an non existing destination
    # An non-exceptional error is user attempting to log in to an non-existing user
    # An non-exceptional error is user attempting to log with the wrong user

    message_id = "(Missing)"
    if WEBSOCKET_MESSAGE_ID in message:
      message_id = message[WEBSOCKET_MESSAGE_ID]

    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message_id,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_ERROR,
      WEBSOCKET_MESSAGE_ERROR : error,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ERROR
    })

  ##### AUTH METHODS #####
  async def respond_auth_message(self, message: Dict[str, Any], isAuth, user, session_id):
    await self.messenger(
      WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE, {
        MESSENGER_CONSUMER : self,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_SESSION_ID : session_id,
        AUTH_IS_AUTHENTICATED : isAuth,
        DATA_USER : user
      }
    )


  async def respond_reject_auth_message(self, message: Dict[str, Any]):
    await self.messenger(
      WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE, {
        MESSENGER_CONSUMER : self,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_SESSION_ID : "",
        AUTH_IS_AUTHENTICATED : False,
        DATA_USER : None
      }
    )


  ### End Model Primitives
  # Order functions
  async def _RejectFreeing(self, message: Dict) -> None:
    await self.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, {
      MESSENGER_CONSUMER : self,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      AUTH_IS_AUTHENTICATED : False,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_DATA : {},
      WEBSOCKET_REFRESH : False,
    })


  async def authenticate_from_auth(self, message):
    Auth = message[DATA_AUTH]
    user: User = await get_user(self.scope)
    authentication_result: Tuple[AuthenticationResult,
                                 Optional[User]] = await database_sync_to_async(auth.authenticate_user)(
      username=Auth[AUTH_USERNAME],
      password=Auth[AUTH_PASSWORD],
      logged_in_user=user
    )

    result, _ = authentication_result

    return result, user

"""This module contains the Websocket that handles ALL communication between the server and the client!

Namely the Consumer Class.

The Consumer class has a DatabaseInterface which is responsible for all communication with database

Note: This module doesn't scale at large, simply because all users are in
 a single group. So it should not surprise anybody if stuff starts to break
 if Tracershop starts to scale.
"""
__author__ = "Christoffer Vilstrup Jensen"


# Python standard Library
from asgiref.sync import sync_to_async
from datetime import datetime, date
from enum import Enum
from subprocess import call
import logging
from pprint import pformat
import traceback
import time
from typing import Any, Dict, List, Callable, Optional, Tuple

# Django packages
from channels.db import database_sync_to_async
from channels.auth import login, get_user, logout
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels_redis.core import RedisChannelLayer
from django.contrib.auth import authenticate
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.core.serializers import serialize
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.conf import settings
from django.db.utils import IntegrityError
from django.utils import timezone

# Tracershop Production packages
from core.side_effect_injection import DateTimeNow
from core.exceptions import IllegalActionAttempted, RequestingNonExistingEndpoint
from constants import DEBUG_LOGGER, ERROR_LOGGER, DATA_DATETIME_FORMAT,\
    CHANNEL_GROUP_GLOBAL, AUDIT_LOGGER
from shared_constants import AUTH_PASSWORD, AUTH_USER, AUTH_USERNAME, AUTH_IS_AUTHENTICATED, \
    ERROR_INSUFFICIENT_PERMISSIONS, ERROR_INVALID_MESSAGE_TYPE, ERROR_NO_MESSAGE_ID,\
    ERROR_UNKNOWN_FAILURE, ERROR_TYPE, NO_ERROR,\
    DATA_ACTIVITY_ORDER, DATA_AUTH, DATA_DELIVER_TIME, DATA_INJECTION_ORDER, DATA_VIAL,\
    DATA_USER, DATA_USER_ASSIGNMENT,\
    WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, WEBSOCKET_DATE,\
    WEBSOCKET_MESSAGE_AUTH_LOGIN, WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI, \
    WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,\
    WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,\
    WEBSOCKET_MESSAGE_ECHO, WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION,\
    WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_GET_STATE,\
    WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_MASS_ORDER,\
    WEBSOCKET_MESSAGE_MODEL_CREATE, WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_EDIT,\
    WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_OBJECT_DOES_NOT_EXISTS,\
    WEBSOCKET_MESSAGE_RESTORE_ORDERS, WEBSOCKET_MESSAGE_ERROR,\
    WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE, \
    WEBSOCKET_REFRESH, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,\
    WEBSOCKET_MESSAGE_LOG_ERROR, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT,\
    WEBSOCKET_MESSAGE_STATUS, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_RESTART_VIAL_DOG,\
    WEBSOCKET_MESSAGE_GET_BOOKINGS, ERROR_NO_VALID_TIME_SLOTS, ERROR_EARLY_BOOKING_TIME,\
    ERROR_EARLY_TIME_SLOT, WEBSOCKET_ERROR, WEBSOCKET_MESSAGE_TEST_PRINTER,\
    WEBSOCKET_MESSAGE_RELEASE_MULTI, WEBSOCKET_MESSAGE_GET_TELEMETRY
from database.database_interface import DatabaseInterface
from database.TracerShopModels.telemetry_models import TelemetryRecordStatus
from database.telemetry import create_telemetry_record
from database.models import OrderStatus, Vial, InjectionOrder,\
      User, UserGroups, UserAssignment, SuccessfulLogin
from lib.formatting import toDateTime, formatFrontendErrorMessage, toDate, timeConverter
from lib.ProductionJSON import encode, decode
from lib.printing import create_document

from tracerauth.audit_logging import logFreeActivityOrders, logFreeInjectionOrder
from tracerauth import auth
from tracerauth.ldap import checkUserGroupMembership
from tracerauth.types import AuthenticationResult

from websocket.handler import MessageHandler

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
  channel_layer: RedisChannelLayer

  def __init__(self, db = DatabaseInterface(), datetimeNow = DateTimeNow()):
    super().__init__()
    self.handler = MessageHandler()
    self.db = db
    self.datetimeNow = datetimeNow

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data: Dict) -> str:
    return encode(text_data)

  @classmethod
  async def decode_json(cls, content: str) -> Dict:
    return decode(content)

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

  async def disconnect(self, close_code):
    user = await get_user(self.scope)
    await self.leaveUserGroups(user)
    await self.channel_layer.group_discard(self.global_group, self.channel_name)
    logger.debug(f"{user} disconnected!")


  def _prepBroadcastMessage(self, message: Dict[str, Any]) -> None:
    if 'type' not in message:
      message['type'] = "broadcastMessage" # This is needed to point it to the send place

    if WEBSOCKET_MESSAGE_SUCCESS not in message:
      message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS

    for key, value in message.items():
      if isinstance(value, Enum):
        message[key] = value.value


  async def _broadcastGlobal(self, message: Dict):
    """Broadcast a message to all connected users

    Args:
        message (Dict): Message to be broadcast
    """
    self._prepBroadcastMessage(message)
    await self.channel_layer.group_send(self.global_group, message) #


  async def _broadcastProduction(self, message: Dict):
    """Broadcast only to the group production

    Args:
        message (Dict): Message to be send
    """
    self._prepBroadcastMessage(message)
    await self.channel_layer.group_send('production', message) #


  async def _broadcastCustomer(self, message: Dict, customerIDs: Optional[List[int]]):
    self._prepBroadcastMessage(message)
    if customerIDs is None:
      await self._broadcastGlobal(message)
      return

    await self._broadcastProduction(message)
    for customerID in customerIDs:
      await self.channel_layer.group_send(f'customer_{customerID}', message)


  async def broadcastMessage(self, message: Dict):
    """WARNING: IS THIS A PRIVATE HELPER FUNCTION THAT YOU SHOULDN'T CALL IN
    HANDLER FUNCTIONS. Use __broadcastGlobal instead!

    Send the event to each subscriber of the websocket channel.
    Note this function gets call for each websocket connected to the group

    This function is called by __broadcast

    Note that this function CANNOT be named with leading underscore due to
    constraints made by channels
    """
    await self.send_json(message)


  #Receive data from Websocket
  async def receive_json(self, message: Dict) -> None:
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
    time_start_ns = time.monotonic_ns()
    try:
      error = auth.validateMessage(message)
      if error != NO_ERROR:
        error_logger.error(f"Handling an invalid message {message}")
        error_logger.error(f"With error code: {error}")
        await self.RespondWithError(message, {ERROR_TYPE : error})
        return

      logger.info(f"Websocket received message: {message[WEBSOCKET_MESSAGE_ID]} - {message[WEBSOCKET_MESSAGE_TYPE]}")
      user = await get_user(self.scope)
      if not auth.AuthMessage(user, message):
        logger.info(f"Insufficient Rights for {user}!")
        await self.RespondWithError(message, {ERROR_TYPE : ERROR_INSUFFICIENT_PERMISSIONS})
        return

      await self.handler(self, message)

      time_end_ns = time.monotonic_ns()
      latency_ms = (time_end_ns - time_start_ns) / 1_000_000 # factor a million between ms and ns
      await create_telemetry_record(message[WEBSOCKET_MESSAGE_TYPE], latency_ms, TelemetryRecordStatus.SUCCESS)

    except IllegalActionAttempted:
      error_logger.critical(pformat(f"""user: {user} send the message {pformat(message)} which contains an action witch the system detected as Illegal, either we got a pen tester, a bad actor or a frontend error."""))
    except Exception as E: # pragma: no cover
      # Very broad catch here, to prevent a hanging message on the client side
      await self.HandleUnknownError(E, message)
      time_end_ns = time.monotonic_ns()
      latency_ms = (time_end_ns - time_start_ns) / 1_000_000 # factor a million between ms and ns
      await create_telemetry_record(message[WEBSOCKET_MESSAGE_TYPE], latency_ms, TelemetryRecordStatus.FAILURE)

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
    })

  ##### Handlers #####
  # Universal Handlers
  async def HandleEcho(self, message : Dict):
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  ##### AUTH METHODS #####
  async def respond_auth_message(self, message: Dict[str, Any], isAuth, serialized_user, session_id):
    await self.send_json({
      AUTH_IS_AUTHENTICATED : isAuth,
      AUTH_USER : serialized_user,
      WEBSOCKET_SESSION_ID : session_id,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  async def respond_reject_auth_message(self, message: Dict[str, Any]):
    await self.send_json({
      AUTH_IS_AUTHENTICATED : False,
      AUTH_USER : {},
      WEBSOCKET_SESSION_ID : "",
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  async def handleLogin(self, message: Dict[str, Any]):
    """Handles a login request by the user

    Args:
      message (Dict[str, Any]): message send by the user with extra fields:
                                  DATA_AUTH
                                  AUTH_USERNAME
                                  AUTH_PASSWORD
    """
    auth = message[DATA_AUTH]
    username = auth[AUTH_USERNAME]
    password = auth[AUTH_PASSWORD]
    user: User = await database_sync_to_async(authenticate)(username=username,
                                                            password=password)
    if user:
      if user.user_group == UserGroups.Anon:
        success, newUserGroup = checkUserGroupMembership(user.username)
        if newUserGroup is not None or UserGroups.Anon:
          user.user_group = newUserGroup
          await database_sync_to_async(user.save)()
      await login(self.scope, user)
      await sync_to_async(self.scope["session"].save)()
      await self.enterUserGroups(user)
      serialized_user = await self.db.async_serialize_dict({DATA_USER : [user]})
      return await self.respond_auth_message(message,
                                             True,
                                             serialized_user,
                                             self.scope["session"].session_key)
    return await self.respond_reject_auth_message(message)

  # This is a mess
  async def handleWhoAmI(self, message):
    now = self.datetimeNow.now()

    user = await get_user(self.scope)
    if isinstance(user, User):
      logger.info(f"WhoAmI message found: {user} from session cookie")
      await self.enterUserGroups(user)
      user_serialized = await self.db.async_serialize_dict({DATA_USER : [user]})
      if user.user_group == UserGroups.ShopExternal:
        logins = await database_sync_to_async(SuccessfulLogin.objects.filter)(user=user)
        await database_sync_to_async(logins.delete)()
      return await self.respond_auth_message(message, True, user_serialized, self.scope["session"].session_key)
    elif isinstance(user, AnonymousUser):
      user = await database_sync_to_async(auth.get_login)(now)
      logger.info(f"Found user:{user} from external users")
      if not isinstance(user, AnonymousUser):
        await login(self.scope, user, backend='tracerauth.backend.TracershopAuthenticationBackend')
        session = self.scope["session"]
        await database_sync_to_async(session.save)()
        await self.enterUserGroups(user)
        serialized_user = await self.db.async_serialize_dict({DATA_USER : [user]})
        session_key = self.scope["session"].session_key
        return await self.respond_auth_message(message,
                                                True,
                                                serialized_user,
                                                session_key)
    await self.respond_reject_auth_message(message)

  async def handleLogout(self, message):
    user = await get_user(self.scope)
    await self.leaveUserGroups(user)
    await logout(self.scope)
    await sync_to_async(self.scope['session'].save)()
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  ### GET STATE
  async def HandleGetState(self, message: Dict):
    """Retrieves state from the user in scope

    Args:
      message: (Dict) - This is message send by the user.
                        It have no specialized keys
    """
    now = self.datetimeNow.now()

    if(WEBSOCKET_DATE in message):
      try:
        now = datetime.strptime(message[WEBSOCKET_DATE][:10], '%Y-%m-%d')
        now = datetime.astimezone(now, timezone.now().tzinfo)
      except ValueError:
        pass

    # Assumed to have no Field in the message since it can use the user in scope

    instances = await self.db.getState(now,
                                       await get_user(self.scope))
    state = await self.db.async_serialize_dict(instances)

    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : state,
      WEBSOCKET_REFRESH : True,
    })

  ### Model modification
  async def HandleModelDelete(self, message: Dict[str, Any]):
    """Primitive endpoint for delete a model
    Broadcasts it to global if successful, reposes if failed.
    Args:
      message (Dict[str, Any]): Dictionary containing the information to delete
                                A model. Specify the tags:
                                    WEBSOCKET_DATA_ID - int / List[int]
                                    WEBSOCKET_DATATYPE - DATA_XXX
    """
    user = await get_user(self.scope)
    success = await self.db.deleteModels(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA_ID],
      user
    )

    if success:
      await self._broadcastGlobal({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
        WEBSOCKET_DATA_ID : message[WEBSOCKET_DATA_ID],
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })
    else:
      logger.info(f"""
        User: {user.username} attempted to delete {message[WEBSOCKET_DATATYPE]}
        They attempted to delete object {message[WEBSOCKET_DATA_ID]}
        """)

      await self.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })

  async def HandleModelCreate(self, message: Dict[str, Any]):
    """Primitive endpoint for creating a model
    Broadcasts it to global

    Args:
      message: Dict[str, Any] - Requires additional tag:
                                  WEBSOCKET_DATA
                                  WEBSOCKET_DATATYPE
    """
    user = await get_user(self.scope)
    try:
      instances = await self.db.handleCreateModels(message[WEBSOCKET_DATATYPE],
                                                   message[WEBSOCKET_DATA],
                                                   user)
    except IntegrityError as e:
      error_message = str(e)
      await self.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.CONSTRAINTS_VIOLATED,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : error_message
      })
      return
    except ValidationError as e:
      await self.send_json({
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.VALIDATION_FAILED,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_ERROR : e.error_dict
      })
      return

    serialized_data = await self.db.async_serialize_dict({
      message[WEBSOCKET_DATATYPE] : instances
    })
    await self._broadcastGlobal({
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : serialized_data,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
      WEBSOCKET_REFRESH : False,
    })


  async def HandleModelEdit(self, message: Dict) -> None:
    """Primitive endpoint for editing a model

    Broadcasts the model if successful

    Args:
      message (Dict[str, Any]): message sent by the user
    """
    user = await get_user(self.scope)

    updatedModels = await self.db.handleEditModels(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA],
      user
    )

    logger.debug(f"Updating {message[WEBSOCKET_DATATYPE]}")

    if updatedModels is not None:
      customerIDs = await self.db.getCustomerIDs(updatedModels)

      serialized_data = await self.db.async_serialize_dict({
        message[WEBSOCKET_DATATYPE] : updatedModels
      })
      await self._broadcastCustomer({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_DATA : serialized_data,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_REFRESH : False
      }, customerIDs)
    else:
      logger.debug("Edit update failed! Hopefully something else is logged somewhere")
      await self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_EDIT,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
      })

  ### End Model Primitives
  # Order functions
  async def _RejectFreeing(self, message : Dict) -> None:
    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      AUTH_IS_AUTHENTICATED : False
    })


  async def _authenticateFreeing(self, message):
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

  async def HandleFreeActivityOrderTimeSlot(self, message: Dict[str, Any]):
    """Handler for freeing an activity order

      Args:
        message (Dict): Message send by the user with the fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_DELIVER_TIME_ID - ID of activity order time slot to be freed
            DATA_VIAL - A list of Vial ID that's being freed with this order
          DATA_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username

    """
    # This is 4 step function
    # 1. Authenticate, if fail return
    # 2. Assign vials to order
    # 3. update order
    # 4. Broadcast to users

    # Turn this into a function
    result, user = await self._authenticateFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await self._RejectFreeing(message)


    # Authentication successful update
    data = message[WEBSOCKET_DATA]
    orders, vials = await self.db.releaseOrders(data[DATA_DELIVER_TIME],
                                                data[DATA_ACTIVITY_ORDER],
                                                data[DATA_VIAL],
                                                user,
                                                self.datetimeNow.now())
    logFreeActivityOrders(user, orders, vials)
    customerIDs = await self.db.getCustomerIDs(orders)

    newState = await self.db.async_serialize_dict({
      DATA_ACTIVITY_ORDER : orders,
      DATA_VIAL : vials
    })

    await self._broadcastCustomer({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : newState,
    }, customerIDs)


  async def HandleFreeInjectionOrder(self, message : Dict) -> None:
    """This function handles freeing Injection based orders

    Args:
        message (Dict): Message with the following fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_OID - ID of injection order to freed
            KEYWORD_BATCHNR - batch number of material.
          DATA_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username
    """
    # This is 3 step function
    # 1. Authenticate, if fail return
    # 2. update order
    # 3. Broadcast to users

    # Step 1: Determine the user credentials are valid
    result, user = await self._authenticateFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await self._RejectFreeing(message)

    # Step 2
    order: InjectionOrder = await self.db.getModel(InjectionOrder, message[WEBSOCKET_DATA][WEBSOCKET_DATA_ID])
    order.lot_number = message[WEBSOCKET_DATA]['lot_number']
    order.freed_datetime = self.datetimeNow.now()
    order.freed_by = self.scope['user']
    order.status = OrderStatus.Released
    await self.db.saveModel(order, user) # Note this may fail!
    # Log the change to db
    logFreeInjectionOrder(user, order)

    # Step 3 Broadcast it
    released_orders = await self.db.async_serialize_dict({
        DATA_INJECTION_ORDER : [order],
    })

    await self._broadcastProduction({
        AUTH_IS_AUTHENTICATED : True,
        WEBSOCKET_REFRESH : False,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_DATA : released_orders,
    })

  async def HandleReleaseMultiInjection(self, message):
    result, user = await self._authenticateFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await self._RejectFreeing(message)

    if not user.is_production_member:
      return await self._RejectFreeing(message)

    release_time = self.datetimeNow.now()

    orders = await self.db.release_many_injections_orders(
      message[WEBSOCKET_DATA_ID], message[WEBSOCKET_DATA], release_time, user
    )

    updated_orders = await self.db.async_serialize_dict({
      DATA_INJECTION_ORDER : orders
    })

    return await self._broadcastProduction({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : updated_orders
    })

  async def HandleMoveOrders(self, message : Dict):
    """Moves an order to another time slot

    Args:
      message (Dict[str, Any]): message send by the user with extra fields:
        WEBSOCKET_DATA
          DATA_ACTIVITY_ORDER
          DATA_DELIVERTIME
    """
    orders = await self.db.moveOrders(message[DATA_ACTIVITY_ORDER], message[DATA_DELIVER_TIME])
    customerIDs = await self.db.getCustomerIDs(orders)
    data = await self.db.async_serialize_dict({DATA_ACTIVITY_ORDER : orders,})

    await self._broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)

  async def HandleRestoreOrders(self, message : Dict):
    """Restore an order to it's original time slot

    Args:
      message (Dict[str, Any]): message send by the user with extra fields:
        WEBSOCKET_DATA
          DATA_ACTIVITY_ORDER
          DATA_DELIVERTIME
    """
    orders = await self.db.restoreDestinations(message[DATA_ACTIVITY_ORDER])
    customerIDs = await self.db.getCustomerIDs(orders)
    data = await self.db.async_serialize_dict({
      DATA_ACTIVITY_ORDER : orders,
    })

    await self._broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)

  async def HandleGetTimeSensitiveData(self, message: Dict[str, Any]):
    """Gets the orders around a point in time

    Args:
      message (Dict[str, Any]): request to get the orders, contains extra fields:
                                  WEBSOCKET_DATE - Central date
    """
    user = await get_user(self.scope)
    client_date = toDateTime(message[WEBSOCKET_DATE][:19])
    data = await self.db.async_serialize_dict(
      await self.db.getTimeSensitiveData(client_date, user)
    )

    await self.send_json({
      WEBSOCKET_DATA : data,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_REFRESH : True,
    })

  async def HandleMassOrder(self, message: Dict[str, Any]):
    """Handler function for the WEBSOCKET_MESSAGE_MASS_ORDER messages.
    The message types indicates a user wishes to place a number of orders
    such that some bookings will have sufficient tracer.

    Bookings have related procedures which knows what tracer and amount is
    needed.

    Args:
        message (Dict[str, Any]): message send by the user. Has the
                                  WEBSOCKET_DATA with a dict value on the format
                                  { $AccessionNumber : Boolean }
                                  Each $AccessionNumber may be related to a
                                  booking object, if not it's ignored.
                                  The Boolean describes if the over is accepted
                                  or rejected.
    """
    user = await get_user(self.scope)

    try:
      orders = await self.db.massOrder(message[WEBSOCKET_DATA], user)
    except RequestingNonExistingEndpoint as exception: # pragma: no cover
      if exception.earliest_available_order_time is not None:
        early_booking_time = timeConverter(exception.earliest_available_order_time)
      else:
        early_booking_time = ""

      return await self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ERROR,
        WEBSOCKET_ERROR : {
          ERROR_TYPE : ERROR_NO_VALID_TIME_SLOTS,
          ERROR_EARLY_BOOKING_TIME : timeConverter(exception.booking_start_time),
          ERROR_EARLY_TIME_SLOT : early_booking_time,
        }
      })

    ActivityCustomerIDs = await self.db.getCustomerIDs(orders[DATA_ACTIVITY_ORDER])
    InjectionCustomerIDs = await self.db.getCustomerIDs(orders[DATA_INJECTION_ORDER])

    customerIDset = set(ActivityCustomerIDs+InjectionCustomerIDs)
    customerIDs = [customerID for customerID in customerIDset]

    data =  await self.db.async_serialize_dict(orders)
    await self._broadcastCustomer({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    }, customerIDs)

  async def HandleChangeExternalPassword(self, message: Dict[str, Any]):
    user: User = await get_user(self.scope)
    # Message Extraction
    externalUserID = message[WEBSOCKET_DATA_ID]
    externalNewPassword = message[AUTH_PASSWORD]

    if user.user_group not in [UserGroups.Admin, UserGroups.ProductionAdmin]:
      error_logger.error(f"User: {user.username} attempted to change password of {externalUserID}")
      return

    try:
      await self.db.changeExternalPassword(externalUserID, externalNewPassword)
    except ObjectDoesNotExist:
      return await self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_OBJECT_DOES_NOT_EXISTS,
        WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT.value,
      })
    except IllegalActionAttempted:
      error_logger.error("Somehow an illegal action was attempted!")
      return
    # Success return message
    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value
    })

  async def HandleCreateExternalUser(self, message):
    user: User = await get_user(self.scope)
    if not user.is_production_admin:
      raise IllegalActionAttempted
    newUser, newUserAssignment = await self.db.createExternalUser(message[WEBSOCKET_DATA])

    if newUserAssignment is not None:
      data = await self.db.async_serialize_dict({DATA_USER : [newUser], DATA_USER_ASSIGNMENT : [newUserAssignment]})
    else:
      data = await self.db.async_serialize_dict({DATA_USER : [newUser]})

    await self._broadcastProduction({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_DATA : data,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
    })

  async def HandleCreateUserAssignment(self, message):
    user = await get_user(self.scope)
    username = message['username']
    customerID = message['customer_id']

    temp_res: Tuple[SUCCESS_STATUS_CREATING_USER_ASSIGNMENT,
                    Optional[UserAssignment],
                    Optional[User]] = await self.db.createUserAssignment(username, customerID, user)
    success, user_assignment, new_user = temp_res

    if success != SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS:
      return await self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_STATUS : success.value,
      })

    if user_assignment is None: # pragma no cover
      error_logger.critical("Somebody somewhere fucked up a contract...")

    returnDict = {
      DATA_USER_ASSIGNMENT : [user_assignment],
    }
    if new_user is not None:
      returnDict[DATA_USER] = [new_user]

    serializedReturnDict = await self.db.async_serialize_dict(returnDict)

    return await self._broadcastGlobal({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : success.value,
      WEBSOCKET_DATA : serializedReturnDict,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
    })

  async def HandleLogFrontendError(self, message: dict):
    """Logs criticals errors produced on the frontend

    Args:
        message (dict): {
          WEBSOCKET_MESSAGE_ERROR : A Javascript error prop
        }
    """
    user = await get_user(self.scope)
    formatted_error = formatFrontendErrorMessage(message[WEBSOCKET_MESSAGE_ERROR])
    error_logger.error(
      f"User: {user} encountered critical error: {formatted_error}"
    )

  async def HandleRestartVials(self, message: Dict[str, Any]):
    """Restarts the vial fetcher system

    Args:
        message (Dict[str, Any]): the message from the websocket
    """
    user: User = await get_user(self.scope)

    if user.is_production_member:
      try:
        call(['sudo', 'systemctl', 'restart', 'vialdog'], timeout=1.0)
      except Exception:
        error_logger.error("Web service is not setup in sudoers!")
      audit_logger.info(f"user: {user.username} restarted the vial dog")

  async def HandleGetBookings(self, message: Dict[str, Any]):
    """This is mostly here because Bookings ended up being 10 mb data

    Args:
        message (Dict[str, Any]): _description_
    """
    booking_date = toDate(message[WEBSOCKET_DATE][:10])
    bookings = await self.db.get_bookings(
      booking_date,
      message[WEBSOCKET_DATA_ID]
    )

    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS.value,
      WEBSOCKET_DATA : bookings,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_BOOKINGS,
    })

  async def HandleTestPrinter(self, message):
    pass

  async def HandlePrintVial(self, message):
    vial = await self.db.get_model(Vial, message[WEBSOCKET_DATA_ID])
    document_path = await create_document(vial)

  async def HandleGetTelemetry(self, message):
    user: User = await get_user(self.scope)

    if not user.is_server_admin:
      raise IllegalActionAttempted()

    serialized_data = await self.db.get_telemetry_data()

    await self.send_json({
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : serialized_data,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_TELEMETRY
    })

  Handlers: Dict[str, Callable[['Consumer', Dict], None]] = {
    WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT : HandleCreateUserAssignment,
    WEBSOCKET_MESSAGE_AUTH_LOGIN : handleLogin,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT : handleLogout,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI : handleWhoAmI,
    WEBSOCKET_MESSAGE_ECHO : HandleEcho,
    WEBSOCKET_MESSAGE_MODEL_CREATE : HandleModelCreate,
    WEBSOCKET_MESSAGE_MODEL_EDIT : HandleModelEdit,
    WEBSOCKET_MESSAGE_RESTART_VIAL_DOG : HandleRestartVials,
    WEBSOCKET_MESSAGE_MODEL_DELETE : HandleModelDelete,
    WEBSOCKET_MESSAGE_GET_STATE : HandleGetState,
    WEBSOCKET_MESSAGE_GET_BOOKINGS : HandleGetBookings,
    WEBSOCKET_MESSAGE_GET_ORDERS : HandleGetTimeSensitiveData,
    WEBSOCKET_MESSAGE_MOVE_ORDERS : HandleMoveOrders,
    WEBSOCKET_MESSAGE_RESTORE_ORDERS : HandleRestoreOrders,
    WEBSOCKET_MESSAGE_FREE_ACTIVITY : HandleFreeActivityOrderTimeSlot,
    WEBSOCKET_MESSAGE_FREE_INJECTION : HandleFreeInjectionOrder,
    WEBSOCKET_MESSAGE_MASS_ORDER : HandleMassOrder,
    WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD : HandleChangeExternalPassword,
    WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER : HandleCreateExternalUser,
    WEBSOCKET_MESSAGE_LOG_ERROR : HandleLogFrontendError,
    WEBSOCKET_MESSAGE_TEST_PRINTER : HandleTestPrinter,
    WEBSOCKET_MESSAGE_RELEASE_MULTI : HandleReleaseMultiInjection,
    WEBSOCKET_MESSAGE_GET_TELEMETRY : HandleGetTelemetry
  }

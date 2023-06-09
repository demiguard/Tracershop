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
import decimal
import logging
from pprint import pprint
from typing import Dict, List, Callable, Coroutine

# Django packages
from channels.db import database_sync_to_async
from channels.auth import login, get_user, logout
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY, SESSION_KEY, HASH_SESSION_KEY
from django.contrib.sessions.backends.db import SessionStore
from django.core.serializers import serialize

# Tracershop Production packages
from core.side_effect_injection import DateTimeNow
from core.exceptions import SQLInjectionException
from dataclass.ProductionDataClasses import *
from constants import * # Import the many WEBSOCKET constants, TO DO change this
from database.database_interface import DatabaseInterface
from database.models import ActivityOrder, ActivityDeliveryTimeSlot,\
      OrderStatus, Vial, InjectionOrder, Booking, BookingStatus,\
      TracerTypes, DeliveryEndpoint, ActivityProduction
from lib import orders
from lib.Formatting import FormatDateTimeJStoSQL, ParseSQLField, toDateTime, toDate
from lib.ProductionJSON import encode, decode
from tracerauth import auth


logger = logging.getLogger('DebugLogger')
error_logger = logging.getLogger("ErrorLogger")

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
  channel_name = 'websocket'
  global_group = "Global"

  def __init__(self, db = DatabaseInterface(), datetimeNow = DateTimeNow()):
    super().__init__()
    self.db = db
    self.datetimeNow = datetimeNow
    self.sessionStore = SessionStore()
    decimal.getcontext().prec = 2

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data: Dict) -> str:
    return encode(text_data)

  @classmethod
  async def decode_json(cls, content: str) -> Dict:
    return decode(content)

  ### --- Websocket methods --- ####
  async def connect(self):
    if self.groups is not None:
      self.groups.append(self.global_group)
    if self.channel_layer is not None:
      await self.channel_layer.group_add(
        self.global_group,
        self.channel_name
      )

    await self.accept()

  async def disconnect(self, close_code):
    if self.groups is not None and self.channel_layer is not None:
      for group_name in self.groups:
        await self.channel_layer.group_discard(group_name,self.channel_name)

  async def __boardcast(self, message: Dict):
    message['type'] = "__sendEvent" # This is needed to point it to the send place
    await self.channel_layer.group_send(self.global_group, message)

  async def __sendEvent(self, event: Dict):
    """
      Send the event to each websocket. Note this function gets call for each websocket connected to the group
    """
    await self.send_json(event)


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
    try:
      error = auth.validateMessage(message)

      if error != "":
        if WEBSOCKET_MESSAGE_ID in message:
          logger.error(f"The message {message[WEBSOCKET_MESSAGE_ID]} was send, It's not valid by the error: {error}")
        else:
          logger.error(f"A message without message ID was send, it's not valid by the error: {error}")
        await self.HandleKnownError(message, error)
        return
      logger.info(f"Websocket received message: {message[WEBSOCKET_MESSAGE_ID]} - {message[WEBSOCKET_MESSAGE_TYPE]}")
      user = await get_user(self.scope)
      if not auth.AuthMessage(user, message):
        await self.HandleKnownError(message, ERROR_INSUFFICIENT_PERMISSIONS)
        return

      handler = self.Handlers.get(message[WEBSOCKET_MESSAGE_TYPE])
      if handler is None: # pragma no cover
        # This should be impossible to reach, since the validateMessage should throw an error.
        # The only case this should happen is when a message type have been added but a handler have been made
        # I.E It's a NOT implemented case.
        logger.critical(f"Missing handler for {message[WEBSOCKET_MESSAGE_TYPE]}")
        await self.HandleKnownError(message, ERROR_INVALID_MESSAGE_TYPE)
      else:
        await handler(self, message)
    except SQLInjectionException as E:
      user = self.scope['user']
      error_logger.error(f"SQL injection detected by user: {user.username}")
      # Log Some stuff
    except Exception as E: # pragma: no cover
      raise E # Very broad catch here, to prevent a hanging message on the client side
      #await self.HandleUnknownError(E, message)

  ### Error handling ###
  async def HandleUnknownError(self, exception : Exception, FailingMessage : dict):
    """This Function is triggered when an unhandled exception is happens server side.
    It sends an Error message back to the client informing it,
    that server was unable to process the request, due to some unknown bug.
    The intent of this function is better displays bugs to the user, so that they can be fixed.

    Regarding security concerns of displaying code, this project is open source.

    Args:
        exception (Exception): _description_
        FailingMessage : dict
    """
    # Error_logger.error(f"Message {FailingMessage} Failed with Exception {exception} ")
    # If a test case reaches here It should be a known error and either handled or thrown back to the websocket
    await self.send_json({ #pragma: no cover
       WEBSOCKET_MESSAGE_SUCCESS : ERROR_UNKNOWN_FAILURE,
       WEBSOCKET_MESSAGE_ID : FailingMessage[WEBSOCKET_MESSAGE_ID]
    }) # pragma: cover

  async def HandleKnownError(self, message, error):
    if error == ERROR_NO_MESSAGE_ID:
      await self.send_json({
        WEBSOCKET_MESSAGE_SUCCESS: error
      })
    else:
      await self.send_json({
        WEBSOCKET_MESSAGE_SUCCESS: error,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
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
  async def handleLogin(self, message: Dict[str, Any]):
    """Handles a login request by the user

    Args:
      message (Dict[str, Any]): message send by the user with extra fields:
                                  JSON_AUTH
                                    AUTH_USERNAME
                                    AUTH_PASSWORD
    """
    auth = message[JSON_AUTH]
    username = auth[AUTH_USERNAME]
    password = auth[AUTH_PASSWORD]
    user = await database_sync_to_async(authenticate)(username=username, password=password)

    if user:
      isAuth = True
      await login(self.scope, user)
      await sync_to_async(self.scope["session"].save)()
      key = self.scope["session"].session_key
      userGroup = user.UserGroup
      customer = []
    else:
      isAuth = False
      username = ""
      userGroup = 0
      key = ""
      customer = []

    await self.send_json({
      AUTH_USERNAME : username,
      LEGACY_KEYWORD_USERGROUP : userGroup,
      LEGACY_KEYWORD_CUSTOMER : customer,
      AUTH_IS_AUTHENTICATED : isAuth,
      WEBSOCKET_SESSION_ID : key,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  async def handleWhoAmI(self, message):
    user = await get_user(self.scope)
    if isinstance(user, User):
      username = user.username
      isAuth = True
      userGroup = user.UserGroup
      #queryCustomers = await database_sync_to_async(user.Customer.all)()
      customer = []
    else:
      isAuth = False
      username = ""
      userGroup = 0
      customer = []

    await self.send_json({
      AUTH_USERNAME : username,
      LEGACY_KEYWORD_USERGROUP : userGroup,
      LEGACY_KEYWORD_CUSTOMER : customer,
      AUTH_IS_AUTHENTICATED : isAuth,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  async def handleLogout(self, message):
    await logout(self.scope)
    await sync_to_async(self.scope['session'].save)()
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  ##### END Auth methods
  async def __boardcastState(self, message: Dict[str, Any], state: Dict[str, Any]):
    """Sends an update message to the global group

    Args:
      message (Dict[str, Any]): The original message send by the user
      state (Dict[str, Any]): A serilized new state where each keyword is a JSON_XXX
                              And the Value is a list of that type of objects.
    """
    await self.__boardcast({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : state,
    })



  ### GET STATE
  async def HandleGetState(self, message: Dict):
    """Retrieves state from the user in scope

    Args:
      message: (Dict) - This is message send by the user.
                        It have no specialized keys
    """
    # Assumed to have no Field in the message since it can use the user in scope
    instances = await auth.getUserModelInstances(await get_user(self.scope))
    state = await self.db.serialize_dict(instances)
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : state
    })

  ### Model modification
  async def HandleModelDelete(self, message: Dict[str, Any]):
    """Primitive endpoint for delete a model
    Broadcasts it to global if successful, reponeds if failed.
    Args:
      message (Dict[str, Any]): Dictionary containing the information to delete
                                A model. Specify the tags:
                                    WEBSOCKET_DATA_ID
                                    WEBSOCKET_DATATYPE
    """
    success = await self.db.deleteModel(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA_ID],
    )
    if success:
      await self.channel_layer.group_send(self.global_group,{
        WEBSOCKET_DATA : True,
        WEBSOCKET_DATA_ID : message[WEBSOCKET_DATA_ID],
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })
    else:
      await self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_DELETE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_DATA : False,
      })

  async def HandleModelCreate(self, message: Dict[str, Any]):
    """Primitive endpoint for creating a model
    Broadcasts it to global

    Args:
      message: Dict[str, Any] - Requires additional tag:
                                  WEBSOCKET_DATA
                                  WEBSOCKET_DATATYPE
    """
    instance = await self.db.createModel(message[WEBSOCKET_DATATYPE], message[WEBSOCKET_DATA])
    await self.__boardcastState(message, {
      message[WEBSOCKET_DATATYPE] : serialize('json', [instance])
    })


  async def HandleModelEdit(self, message: Dict) -> None:
    """Primitive endpoint for editting a model

    Boardcasts the model if successful

    Args:
      message (Dict[str, Any]): message sendt by the user
    """
    updatedModel = await self.db.editModel(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA],
      message[WEBSOCKET_DATA_ID]
    )
    if updatedModel is not None:
      self.__boardcastState(message, {
        message[WEBSOCKET_DATATYPE] : [serialize('json', updatedModel)]
      })
    else:
      self.send_json({
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MODEL_EDIT,
      })

  ### End Model Primitives
  # Order functions
  async def __RejectFreeing(self, message : Dict) -> None:
    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      AUTH_IS_AUTHENTICATED : False
    })


  async def HandleFreeActivityOrderTimeSlot(self, message: Dict[str, Any]):
    """Handler for freeing an activity order

      Args:
        message (Dict): Message send by the user with the fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_DELIVER_TIME_ID - ID of activity order time slot to be freed
            JSON_VIAL - A list of Vial ID that's being freed with this order
          JSON_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username

    """
    # This is 4 step function
    # 1. Authenticate, if fail return
    # 2. Assign vials to order
    # 3. update order
    # 4. Broadcast to users

    # Turn this into a function
    Auth = message[JSON_AUTH]

    # Quick check if user and auth user matches before any database connection start working
    if not Auth[AUTH_USERNAME] == self.scope['user'].username:
      return await self.__RejectFreeing(message)

    # Authentication successful update
    deliverTime: ActivityDeliveryTimeSlot = await self.db.getModel(JSON_DELIVERTIME, message[WEBSOCKET_DATA][LEGACY_KEYWORD_DELIVER_TIME_ID])

    orders = self.db.releaseOrders(deliverTime, self.scope['user'])
    order = orders[0]

    # Update Vials
    vials: List[Vial] = [await self.db.getModel(JSON_VIAL, vialID) for vialID in message[WEBSOCKET_DATA][JSON_VIAL]]
    for vial in vials:
      vial.assigned_to = order
    await self.db.saveModels(Vial, vials, ['assigned_to'])

    self.channel_layer.group_send(self.global_group, {
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_DATA : {
        JSON_ACTIVITY_ORDER : serialize('json', orders),
        JSON_VIAL : serialize('json', vials),
      },
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
    })


  async def HandleFreeInjectionOrder(self, message : Dict) -> None:
    """This function handles freeing Injection based orders

    Args:
        message (Dict): Message with the following fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_OID - ID of injection order to freed
            KEYWORD_BATCHNR - batch number of material.
          JSON_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username
    """
    # This is 3 step function
    # 1. Authenticate, if fail return
    # 2. update order
    # 3. Broadcast to users

    # Step 1: Determine the user credentials are valid
    Auth = message[JSON_AUTH]

    # Quick check if user and auth user matches before any database connection start working
    if not Auth[AUTH_USERNAME] == self.scope['user'].username:
      return await self.__RejectFreeing(message)

    user = await sync_to_async(authenticate)(username=Auth[AUTH_USERNAME], password=Auth[AUTH_PASSWORD])
    if not user:
      return await self.__RejectFreeing(message)

    # Step 2
    order: InjectionOrder = await self.db.getModel(JSON_INJECTION_ORDER, message[WEBSOCKET_DATA][LEGACY_KEYWORD_OID])
    order.lot_number = message[WEBSOCKET_DATA][LEGACY_KEYWORD_BATCHNR]
    order.freed_datetime = self.datetimeNow.now()
    order.freed_by = self.scope['user']
    order.status = OrderStatus.Released
    self.db.saveModel(order)

    # Step 3 Boardcast it
    self.channel_layer.group_send(self.global_group, {
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_DATA : {
        JSON_INJECTION_ORDER : serialize('json', [order]),
      },
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
    })


  async def HandleMoveOrders(self, message : Dict):
    """Moves an order to another time slot

    Args:
      message (Dict[str, Any]): message send by the user with extra fields:
        WEBSOCKET_DATA
          JSON_ACTIVITY_ORDER
          JSON_DELIVERTIME
    """
    order: ActivityOrder = self.db.getModel(JSON_ACTIVITY_ORDER, message[WEBSOCKET_DATA][JSON_ACTIVITY_ORDER])
    delivertime: ActivityDeliveryTimeSlot = self.db.getModel(JSON_DELIVERTIME, message[WEBSOCKET_DATA][JSON_DELIVERTIME])

    if order.ordered_time_slot == delivertime:
      order.moved_to_time_slot = None
    else:
      order.moved_to_time_slot = delivertime

    self.__boardcastState(message, {
      JSON_ACTIVITY_ORDER : serialize('json', [order])
    })

  async def HandleGetTimeSensitiveData(self, message: Dict[str, Any]):
    """Gets the orders around a point in time

    Args:
      message (Dict[str, Any]): request to get the orders, contains extra fields:
                                  WEBSOCKET_DATE - Central date
    """
    client_date = toDateTime(message[WEBSOCKET_DATE][:19], Format=JSON_DATETIME_FORMAT)
    data = await self.db.getTimeSensitiveData(client_date, self.scope['user'])
    await self.send_json({
      WEBSOCKET_DATA : {key : serialize('json', value) for key, value in data.items()},
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_ORDERS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
    })


  async def handleBookingOrders(self, message: Dict[str, Any]):
    """handles a request to place an order based on bookings
    Only handle a single tracer

    if successful boardcast new orders to all users

    Args:
      message (Dict[str, Any]):
        WEBSOCKET_DATA:
          JSON_TRACER - int mapped to the tracer
          JSON_BOOKING - List[int] - List of IDs of bookings
    """
    # This function does the following things
    # 1. Check if user can order and is not exceeding any deadlines
    # 2. Accumulating the activity / injections of tracer over endpoint / delivery times
    #       Note here there's a difference because activity orders are places at time slots
    #       While injection orders are simply placed


    now = self.datetimeNow.now()
    tracer = await self.db.getModel(JSON_TRACER,
                                    message[WEBSOCKET_DATA][JSON_TRACER],
                                    self.scope['user'])


    if await orders.canOrder(now, tracer):
      bookings, booking_orders = await orders.orderBookings(tracer, message[WEBSOCKET_DATA][JSON_BOOKING])
    else:
      pass

    if tracer.tracer_type == TracerTypes.ActivityBased:
      order_type = JSON_ACTIVITY_ORDER
    elif tracer.tracer_type == TracerTypes.InjectionBased:
      order_type = JSON_INJECTION_ORDER
    else:
      raise Exception

    self.__boardcastState(message,{
      JSON_BOOKING : bookings,
      order_type : booking_orders,
    })



  Handlers = {
    WEBSOCKET_MESSAGE_AUTH_LOGIN : handleLogin,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT : handleLogout,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI : handleWhoAmI,
    WEBSOCKET_MESSAGE_ECHO : HandleEcho,
    WEBSOCKET_MESSAGE_MODEL_CREATE : HandleModelCreate,
    WEBSOCKET_MESSAGE_MODEL_EDIT : HandleModelEdit,
    WEBSOCKET_MESSAGE_MODEL_DELETE : HandleModelDelete,
    WEBSOCKET_MESSAGE_GET_STATE : HandleGetState,
    WEBSOCKET_MESSAGE_GET_ORDERS : HandleGetTimeSensitiveData,
    WEBSOCKET_MESSAGE_MOVE_ORDERS : HandleMoveOrders,
    WEBSOCKET_MESSAGE_FREE_ACTIVITY : HandleFreeActivityOrderTimeSlot,
    WEBSOCKET_MESSAGE_FREE_INJECTION : HandleFreeInjectionOrder,
  }

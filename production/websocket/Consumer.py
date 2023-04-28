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
from calendar import monthrange
from datetime import datetime, date, timedelta
import decimal
import logging
from pprint import pprint
from typing import Dict, List, Callable, Coroutine

# Django packages
from channels.auth import login, get_user, logout
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import authenticate, BACKEND_SESSION_KEY, SESSION_KEY, HASH_SESSION_KEY
from django.contrib.sessions.backends.db import SessionStore
from django.core.serializers import serialize

# Tracershop Production packages
from constants import * # Import the many WEBSOCKET constants, TO DO change this
from database.database_interface import DatabaseInterface
from lib.decorators import typeCheckFunc
from core.exceptions import SQLInjectionException
from lib.Formatting import FormatDateTimeJStoSQL, ParseSQLField, toDateTime, toDate
from lib.mail import sendMail
from lib.ProductionJSON import encode, decode
from dataclass.ProductionDataClasses import *
from lib.utils import LMAP
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

  def __init__(self, db = DatabaseInterface()):
    super().__init__()
    self.db = db
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

  async def sendEvent(self, event: Dict):
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
      if not auth.AuthMessage(self.scope['user'], message):
        await self.HandleKnownError(message, ERROR_INSUFFICIENT_PERMISSIONS)
        return

      handler = self.Handlers.get(message[WEBSOCKET_MESSAGE_TYPE])
      if handler is None: # pragma no cover
        # This should be impossible to reach, since the validateMessage should throw an error.
        # The only case this should happen is when a message type have been added but a handler have been made
        # I.E It's a NOT implemented case.
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
  async def handleLogin(self, message):
    auth = message[JSON_AUTH]
    username = auth[AUTH_USERNAME]
    password = auth[AUTH_PASSWORD]
    user = await sync_to_async(authenticate)(username=username, password=password)
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
      KEYWORD_USERGROUP : userGroup,
      KEYWORD_CUSTOMER : customer,
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
      KEYWORD_USERGROUP : userGroup,
      KEYWORD_CUSTOMER : customer,
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

  async def HandleTheGreatStateMessage(self, message):
    """This function is responsible for sending back the state,
      that the site should be in. It's once when the page is loaded by the App.js

      It fills the following Maps with data:
        orders
        runs
        customer
        vials
        employees
        deliverTimes
        T_orders


    """
    Employees, Customers, DeliverTimes, Isotopes, Vials, Runs, Orders, T_Orders, Tracers, TracerCustomers, ServerConfig, Databases, Address, ClosedDates = await self.db.getGreatState()

    #Convert Dataclasses to python dict to send over
    Customers       = LMAP(encode, Customers)
    ClosedDates     = LMAP(encode, ClosedDates)
    DeliverTimes    = LMAP(encode, DeliverTimes)
    Employees       = LMAP(encode, Employees)
    Isotopes        = LMAP(encode, Isotopes)
    Orders          = LMAP(encode, Orders)
    T_Orders        = LMAP(encode, T_Orders)
    Tracers         = LMAP(encode, Tracers)
    TracerCustomers = LMAP(encode, TracerCustomers)
    Runs            = LMAP(encode, Runs)
    Vials           = LMAP(encode, Vials)
    SerializedDatabases = serialize('json', Databases)
    SerializedAddress = serialize('json', Address)
    SerializedServerConfig = serialize('json', [ServerConfig])

    content = {
      JSON_GREAT_STATE : {
        JSON_ADDRESS          : SerializedAddress,
        JSON_CLOSEDDATE       : ClosedDates,
        JSON_CUSTOMER         : Customers,
        JSON_DATABASE         : SerializedDatabases,
        JSON_DELIVERTIME      : DeliverTimes,
        JSON_EMPLOYEE         : Employees,
        JSON_ISOTOPE          : Isotopes,
        JSON_ACTIVITY_ORDER   : Orders,
        JSON_RUN              : Runs,
        JSON_INJECTION_ORDER  : T_Orders,
        JSON_TRACER           : Tracers,
        JSON_TRACER_MAPPING   : TracerCustomers,
        JSON_VIAL             : Vials,
        JSON_SERVER_CONFIG    : SerializedServerConfig
      },
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GREAT_STATE,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    }
    await self.send_json(content)

  async def HandleCreateDataClass(self, message : Dict):
    """Websocket handler function for production data class creation.

    Programmer Note: I don't really think that the method dict is particularly effective here, just because of how different the functions are.
      While such method is possible by creating a bunch of local method, you're kinda getting the same, result. Look if you disagree fucking fight me!

    Args:
        message (Dict): received message with the following fields
          WEBSOCKET_DATA     - Dict with fields sufficient to create a dataclass
          WEBSOCKET_DATATYPE - Constant specifying the type of data class to be created
          ----- different arguments might be present due to late standardization -----

    Raises:
        ValueError: raised when an unknown WEBSOCKET_DATATYPE is encountered
    """
    dataClass = findDataClass(message[WEBSOCKET_DATATYPE])
    # Specialized Dataclass creations
    if dataClass == ActivityOrderDataClass:
      spooky_skeleton = message[WEBSOCKET_DATA] # A skeleton for a skeleton is pretty spoky ok?
      customer = await self.db.getElement(spooky_skeleton[KEYWORD_BID], CustomerDataClass)
      deliver_datetime = toDateTime(spooky_skeleton[KEYWORD_DELIVER_DATETIME], JSON_DATETIME_FORMAT)
      skeleton = {
        KEYWORD_DELIVER_DATETIME : deliver_datetime,
        KEYWORD_AMOUNT   : spooky_skeleton[KEYWORD_AMOUNT],
        KEYWORD_AMOUNT_O : spooky_skeleton[KEYWORD_AMOUNT] * (1 + customer.overhead / 100.0),
        KEYWORD_TOTAL_AMOUNT   : spooky_skeleton[KEYWORD_AMOUNT],
        KEYWORD_TOTAL_AMOUNT_O : spooky_skeleton[KEYWORD_AMOUNT] * (1 + customer.overhead / 100.0),
        KEYWORD_TRACER : spooky_skeleton[KEYWORD_TRACER],
        KEYWORD_RUN : spooky_skeleton[KEYWORD_RUN],
        KEYWORD_BID : spooky_skeleton[KEYWORD_BID],
        KEYWORD_USERNAME : self.scope['user'].username
      }
      Instance = await self.db.createDataClass(skeleton, ActivityOrderDataClass)
    elif dataClass == InjectionOrderDataClass:
      skeleton = message[WEBSOCKET_DATA]
      deliver_datetime = toDateTime(skeleton[KEYWORD_DELIVER_DATETIME], JSON_DATETIME_FORMAT)
      skeleton[KEYWORD_DELIVER_DATETIME] = deliver_datetime
      skeleton[KEYWORD_USERNAME] = self.scope['user'].username
      Instance = await self.db.createDataClass(skeleton, InjectionOrderDataClass)
    else:
      # General Creation
      Instance = await self.db.createDataClass(message[WEBSOCKET_DATA], dataClass)

    ID = ParseSQLField(dataClass.getIDField())

    await self.channel_layer.group_send(
      self.global_group,{
        WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_DATA : encode(Instance),
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_DATA_ID : ID,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      }
    )

  async def __RejectFreeing(self, message : Dict) -> None:
    await self.send_json({
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      AUTH_IS_AUTHENTICATED : False
    })

  async def HandleFreeActivityOrder(self, message : Dict):
    """

    Args:
        message (Dict): _description_
    """
    # Step 1 Check if user is valid
    Auth = message[JSON_AUTH]

    # Quick check if user and auth user matches before any database connection start working
    if not Auth[AUTH_USERNAME] == self.scope['user'].username:
      return await self.__RejectFreeing(message)

    user = await sync_to_async(authenticate)(username=Auth[AUTH_USERNAME], password=Auth[AUTH_PASSWORD])
    if not user:
      return await self.__RejectFreeing(message)

    data = message[WEBSOCKET_DATA]
    Order      = await self.db.getElement(data[JSON_ACTIVITY_ORDER], ActivityOrderDataClass)
    Vials      = [await self.db.getElement(vialID, VialDataClass) for vialID in data[JSON_VIAL]]

    updatedVials = []
    updateOrders = []

    serverConfiguration = await self.db.getServerConfiguration()
    externalDatabase = await self.db.getExternalDatabase(serverConfiguration)
    if externalDatabase.legacy_database:
      PrimaryVial = Vials[0]
      free_datetime = datetime.now()
      Order.status = 3
      Order.frigivet_af = self.scope['user'].OldTracerBaseID
      Order.frigivet_amount = int(PrimaryVial.activity)
      Order.frigivet_datetime =  free_datetime
      Order.volume = round(float(PrimaryVial.volume),2)
      Order.batchnr = PrimaryVial.charge
      await self.db.updateDataClass(Order)
      updateOrders.append(Order)
      PrimaryVial.order_id = Order.oid
      await self.db.updateDataClass(PrimaryVial)
      updatedVials.append(PrimaryVial)
      DependantOrders = await self.db.freeDependantOrders(Order, self.scope['user'])
      if DependantOrders:
        updateOrders += DependantOrders

      for Vial in Vials[1:]: #The first vial is assoc with the Primary order
        skeleton = {
          KEYWORD_DELIVER_DATETIME : Order.deliver_datetime,
          KEYWORD_STATUS : 3,
          KEYWORD_AMOUNT : 0,
          KEYWORD_AMOUNT_O : 0,
          KEYWORD_TOTAL_AMOUNT : 0,
          KEYWORD_TOTAL_AMOUNT_O : 0,
          KEYWORD_TRACER : Order.tracer,
          KEYWORD_BID : Order.BID,
          KEYWORD_RUN : Order.run,
          KEYWORD_COID : Order.oid,
          KEYWORD_BATCHNR : Vial.charge,
          KEYWORD_FREED_BY : self.scope['user'].OldTracerBaseID,
          KEYWORD_FREED_AMOUNT : Vial.activity,
          KEYWORD_VOLUME : Vial.volume,
          KEYWORD_FREED_DATETIME : free_datetime,
          KEYWORD_COMMENT : f"Extra ordre generated due to multiple vials assigned to order: {Order.oid}",
          KEYWORD_USERNAME : Order.username
        }
        newOrder = await self.db.createDataClass(skeleton, ActivityOrderDataClass)
        Vial.order_id = newOrder.oid
        await self.db.updateDataClass(Vial)
        updatedVials.append(Vial)
        updateOrders.append(newOrder)

      pdfFilePath = await self.db.createPDF(updateOrders, updatedVials)
      Customer    = await self.db.getElement(Order.BID, CustomerDataClass)
      try:
        sendMail(pdfFilePath, Customer, Order, serverConfiguration)
      except Exception as E:
        logger.error(f"could not send mail because: {E}")

      await self.channel_layer.group_send(
        self.global_group, {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
            JSON_ACTIVITY_ORDER : LMAP(lambda x: encode(x.toJSON()), updateOrders),
            JSON_VIAL : LMAP(lambda v: encode(v.toJSON()),updatedVials),
            WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
            WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
            AUTH_IS_AUTHENTICATED : True
          }
        )
    else:
      print("No LegacyMode is no go") # pragma: no cover

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
    # Step 1: Determine the user credentials are valid
    Auth = message[JSON_AUTH]

    # Quick check if user and auth user matches before any database connection start working
    if not Auth[AUTH_USERNAME] == self.scope['user'].username:
      return await self.__RejectFreeing(message)

    user = await sync_to_async(authenticate)(username=Auth[AUTH_USERNAME], password=Auth[AUTH_PASSWORD])
    if not user:
      return await self.__RejectFreeing(message)

    # Step 2: Update the database
    data = message[WEBSOCKET_DATA]
    ConditionalString = f"oid = {data[KEYWORD_OID]} AND status = 2" # the status is there to prevent over writing an already freed order

    ListIODC = await self.db.GetConditionalElements(ConditionalString, InjectionOrderDataClass)

    if ListIODC:
      IODC = ListIODC[0]


      IODC.status = 3
      IODC.batchnr = data[KEYWORD_BATCHNR]
      IODC.frigivet_af = self.scope['user'].OldTracerBaseID
      fdt = datetime.now() # all of this to get rid of micro seconds

      IODC.frigivet_datetime = datetime(fdt.year, fdt.month, fdt.day, fdt.hour, fdt.minute, fdt.second )

      await self.db.updateDataClass(IODC)

      pdfPath = await self.db.createInjectionPDF(IODC)
      await self.channel_layer.group_send(self.global_group, {
        WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_INJECTION,
        JSON_INJECTION_ORDER : encode(IODC.toJSON()),
        AUTH_IS_AUTHENTICATED : True
      })
    else:
      await self.HandleKnownError(message, ERROR_OBJECT_NOT_FOUND)



  async def HandleMoveOrders(self, message : Dict):
    """ This handles a request to move an order.

    TODO: Note that here we have some bad code in that the frontend does a lot calculations
    It should really be the server that does this because, the frontend should just be a pretty picture of
    the underlying database. It also opens a creative soul to, put in whatever in an object and the server will just eat it.

    Potentially bringing the database to an invalid state.


    See README for terminologies.

    Args:
        message Dict: A Dict that have been converted from MoveOrder Message
    """


    """
    returnOrders = []

    # Step 1. Detect if Request is valid
    # Step 1.1 Get Data
    move_request = message[WEBSOCKET_DATA]

    OrderCorotine = self.db.getElement(move_request[KEYWORD_OID], ActivityOrderDataClass)
    TargetRunCorotine = self.db.getElement(move_request[KEYWORD_RUN], DeliverTimeDataClass)


    # Step 1.2 Await Data
    order = await OrderCorotine
    customerCorotine = self.db.getElement()
    tracer = await self.db.getElement(order.tracer, TracerDataClass)
    isotope = await self.db.getElement(tracer.isotope, IsotopeDataClass)
    targetRun = await TargetRunCorotine


    TargetOrderCorotine = self.db.getTargetOrder(
      order, targetRun
    )

    minutesDifference = physics.countMinutes(order.deliver_datetime.time(), targetRun.dtime)
    Activity          = physics.decay(isotope.halflife, minutesDifference, order.amount)

    if order.COID != -1:
      MasterOrderCorotine = self.db.getElement(order.COID, ActivityOrderDataClass)




    TargetOrder = await TargetOrderCorotine
    MasterOrder = await MasterOrderCorotine

    # Step 2 Update State
    if MasterOrder:
      Master

    # Step 3 If needed Create Ghost Order

    # Step 4 Delete Extra Orders

    # Step 5 Await State Changes

    # Step 6 Respond
    """

    def IsDead(Order: ActivityOrderDataClass) -> bool: #Helper that can be exported easily if need be
      return Order.amount == 0.0 and Order.total_amount < 1.0

    updatedOrders = message[JSON_ACTIVITY_ORDER]
    GhostOrderMessage = message.get(JSON_GHOST_ORDER)
    deadOrders   = []
    returnOrders = [] # this mainly done So I can uniformly update
    if GhostOrderMessage:
      ### Create GhostOrder
      ### The Ghost kw should be moved into constants
      deliverTime = toDateTime(GhostOrderMessage["GhostOrderDeliverTime"], JSON_DATETIME_FORMAT)
      CustomerID = GhostOrderMessage["CustomerID"]
      amount_total = float(GhostOrderMessage["GhostOrderActivity"])
      amount_total_o = float(GhostOrderMessage["GhostOrderActivityOverhead"])
      TracerID = GhostOrderMessage["Tracer"]
      run = int(GhostOrderMessage["GhostOrderRun"])

      GhostOrderSkeleton = {
        KEYWORD_DELIVER_DATETIME : deliverTime,
        KEYWORD_STATUS : 2,
        KEYWORD_AMOUNT : 0,
        KEYWORD_AMOUNT_O : 0,
        KEYWORD_TOTAL_AMOUNT : amount_total,
        KEYWORD_TOTAL_AMOUNT_O : amount_total_o,
        KEYWORD_TRACER : TracerID,
        KEYWORD_RUN : run,
        KEYWORD_BID : CustomerID,
        KEYWORD_BATCHNR : "",
        KEYWORD_COID : -1,
        KEYWORD_COMMENT : f"Spøgelse bestilling",
        KEYWORD_USERNAME : self.scope['user'].username
      }

      GhostOrder = await self.db.createDataClass(
        GhostOrderSkeleton,
        ActivityOrderDataClass
      )

      returnOrders.append(GhostOrder)
      #End GhostOrder IF

    #Update the orders in the Database
    for orderDict in updatedOrders:
      order = ActivityOrderDataClass.fromDict(orderDict)
      if IsDead(order):
        #Delete Orders later
        deadOrders.append(order.oid)
      else:
        if GhostOrderMessage:
          if GhostOrderMessage["MappedOrder"] == order.oid:
            order.COID = GhostOrder.oid

        returnOrders.append(order)
        await self.db.updateDataClass(order)

    if deadOrders: await self.db.DeleteIDs(deadOrders, ActivityOrderDataClass)

    await self.channel_layer.group_send(
      self.global_group, {
        WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_MOVE_ORDERS,
        JSON_ACTIVITY_ORDER : [encode(rOrder) for rOrder in returnOrders],
        WEBSOCKET_DEAD_ORDERS : deadOrders, # This is a list of OID so no need to encode this
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      }
    )

  async def HandleEditDjango(self, message: Dict) -> None:
    updatedModel = await self.db.editDjango(
      message[WEBSOCKET_DATATYPE],
      message[WEBSOCKET_DATA],
      message[WEBSOCKET_DATA_ID]
    )

  @typeCheckFunc
  async def HandleGetOrders(self, message : Dict):
    client_date = toDateTime(message[WEBSOCKET_DATE][:19], Format=JSON_DATETIME_FORMAT)
    SC = await self.db.getServerConfig()
    startDate = client_date - timedelta(days=SC.DateRange)
    endDate = client_date + timedelta(days=SC.DateRange)
    activityOrders = await self.db.getDataClassRange(startDate, endDate, ActivityOrderDataClass)
    ClosedDates = await self.db.getDataClassRange(startDate, endDate, ClosedDateDataClass)
    injectionOrders = await self.db.getDataClassRange(startDate, endDate, InjectionOrderDataClass)
    Vials = await self.db.getDataClassRange(startDate, endDate, VialDataClass)

    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_ORDERS,
      JSON_CLOSEDDATE : [encode(aClosedDate) for aClosedDate in ClosedDates],
      JSON_ACTIVITY_ORDER : [encode(aOrder) for aOrder in activityOrders],
      JSON_INJECTION_ORDER : [encode(tOrder) for tOrder in injectionOrders],
      JSON_VIAL : [encode(vialDataclass) for vialDataclass in Vials],
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })

  @typeCheckFunc
  async def HandleEditState(self, message : Dict):
    try:
      dataClass = findDataClass(message[WEBSOCKET_DATATYPE])
    except ValueError as E:
      logger.error(E)
      await self.HandleKnownError(message, ERROR_INVALID_DATACLASS_TYPE)
      return

    dataClassInstance = dataClass.fromDict(message[WEBSOCKET_DATA])
    await self.db.updateDataClass(dataClassInstance)
    ID = ParseSQLField(dataClass.getIDField())

    await self.channel_layer.group_send(self.global_group, {
      WEBSOCKET_EVENT_TYPE   : WEBSOCKET_SEND_EVENT,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_EDIT_STATE,
      WEBSOCKET_DATA         : message[WEBSOCKET_DATA],
      WEBSOCKET_DATATYPE     : message[WEBSOCKET_DATATYPE],
      WEBSOCKET_DATA_ID      : ID,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS
    })

  async def HandleDeleteDataClass(self, message : Dict):
    dataClass = findDataClass(message[WEBSOCKET_DATATYPE])
    data = dataClass(**message[WEBSOCKET_DATA])
    if(await self.db.CanDelete(data)):
      #ID = ParseSQLField(dataClass.getIDField())
      await self.db.DeleteInstance(data)
      id_field = dataClass.getIDField()
      ID = getattr(data, id_field)


      await self.channel_layer.group_send(self.global_group, {
        WEBSOCKET_EVENT_TYPE   : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
        WEBSOCKET_DATA         : message[WEBSOCKET_DATA],
        WEBSOCKET_DATATYPE     : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_DATA_ID      : [ID],
        WEBSOCKET_MESSAGE_ID   : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      })
    else:
      pass


  async def HandleGetHistory(self, message : dict):
    """This function retrieves order history of a user from a specific month.
          Note that the final CSV requires extra data needed, however this data should be found in the frontend copy of the database.

    Args:
        message (dict): Message received by the websocket with the args
          * WEBSOCKET_DATE - Date with the month data is to be retrieved from
          * WEBSOCKET_DATA - Customer ID
    """
    Period = toDate(message[WEBSOCKET_DATE])
    _, EndDate = monthrange(Period.year, Period.month)
    StartDate = datetime(Period.year, Period.month, 1, 1, 1,1)
    EndDate   = datetime(Period.year, Period.month, EndDate, 1, 1,1)

    Orders = {}

    condition_AODC = f"BID={message[WEBSOCKET_DATA]} AND status=3 AND {ActivityOrderDataClass.getSQLDateTime()} BETWEEN {SerializeToSQLValue(StartDate)} AND { SerializeToSQLValue(EndDate)}"
    condition_IODC = f"BID={message[WEBSOCKET_DATA]} AND status=3 AND {InjectionOrderDataClass.getSQLDateTime()} BETWEEN {SerializeToSQLValue(StartDate)} AND {SerializeToSQLValue(EndDate)}"

    AODCsCorotine = self.db.GetConditionalElements(condition_AODC, ActivityOrderDataClass)
    IODCsCorotine = self.db.GetConditionalElements(condition_IODC, InjectionOrderDataClass)

    for AODC in await AODCsCorotine:
      receipt = [AODC.oid, AODC.batchnr, AODC.deliver_datetime, AODC.amount, AODC.frigivet_amount]
      if AODC.tracer in Orders:
        Orders[AODC.tracer].append(receipt)
      else:
        Orders[AODC.tracer] = [receipt]

    for IODC in await IODCsCorotine:
      receipt = [IODC.oid, AODC.batchnr, AODC.deliver_datetime, IODC.n_injections, IODC.anvendelse]
      if IODC.tracer in Orders:
        Orders[IODC.tracer].append(receipt)
      else:
        Orders[IODC.tracer] = [receipt]

    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_HISTORY,
      WEBSOCKET_DATA : Orders,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    })


  Handlers = {
    WEBSOCKET_MESSAGE_AUTH_LOGIN : handleLogin,
    WEBSOCKET_MESSAGE_AUTH_LOGOUT : handleLogout,
    WEBSOCKET_MESSAGE_AUTH_WHOAMI : handleWhoAmI,
    WEBSOCKET_MESSAGE_CREATE_DATA_CLASS : HandleCreateDataClass,
    WEBSOCKET_MESSAGE_DELETE_DATA_CLASS : HandleDeleteDataClass,
    WEBSOCKET_MESSAGE_ECHO : HandleEcho,
    WEBSOCKET_MESSAGE_EDIT_STATE : HandleEditState,
    WEBSOCKET_MESSAGE_EDIT_DJANGO : HandleEditDjango,
    WEBSOCKET_MESSAGE_FREE_ACTIVITY : HandleFreeActivityOrder,
    WEBSOCKET_MESSAGE_FREE_INJECTION : HandleFreeInjectionOrder,
    WEBSOCKET_MESSAGE_GREAT_STATE : HandleTheGreatStateMessage,
    WEBSOCKET_MESSAGE_GET_HISTORY : HandleGetHistory,
    WEBSOCKET_MESSAGE_GET_ORDERS : HandleGetOrders,
    WEBSOCKET_MESSAGE_MOVE_ORDERS : HandleMoveOrders,
  }

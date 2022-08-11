"""This module is divided into two parts the consumer and the SQL consumer.
This module handles all websocket messages between the server and all clients
The other module handles all communication between the underlying database and
this client.

Note: This module doesn't scale at large, simply because all users are in
 a single group. So it should not surprise anybody if stuff starts to break
 if Tracershop starts to scale.
"""
__author__ = "Christoffer Vilstrup Jensen"

from django.contrib.auth import authenticate, BACKEND_SESSION_KEY, SESSION_KEY, HASH_SESSION_KEY
from django.core.serializers import serialize
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from django.http import HttpRequest
from django.middleware import csrf

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.auth import login, get_user, logout
from channels.db import database_sync_to_async

from asgiref.sync import sync_to_async
from datetime import datetime, date, timedelta
from typing import Dict, List

from database.models import ServerConfiguration
from constants import * # Import the many WEBSOCKET constants
from lib import pdfs
from lib.decorators import typeCheckfunc
from lib.Formatting import FormatDateTimeJStoSQL, ParseSQLID, toDateTime
from lib.ProductionJSON import encode, decode
from lib.ProductionDataClasses import *
from lib.mail import sendMail
from lib.utils import LMAP
from TracerAuth import auth

from websocket.DatabaseInterface import DatabaseInterface

import logging
from pprint import pprint

logger = logging.getLogger('DebugLogger')


class Consumer(AsyncJsonWebsocketConsumer):
  channel_name = 'websocket'
  global_group = "Global"

  def __init__(self, db = DatabaseInterface()):
    super().__init__()
    self.db = db
    self.sessionStore = SessionStore()

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data: Dict) -> str:
    return encode(text_data)

  @classmethod
  async def decode_json(cls, content):
    return decode(content)

  ### --- Websocket methods --- ####
  async def connect(self):
    self.groups.append(self.global_group)

    await self.channel_layer.group_add(
      self.global_group,
      self.channel_name
    )

    await self.accept()

  async def disconnect(self, close_code):
    for group_name in self.groups:
      await self.channel_layer.group_discard(
        group_name,
        self.channel_name
      )

  #Receive data from Websocket
  async def receive_json(self, message: Dict) -> None:
    """
      This is the server side handler for new message.
      This function should be handler that just Detects the message and then proceeds
       to hand the function to Another function

      Args:
        message - Dict - the json message converted into a python dictionary
                         It has the a message type field and also additional fields
                         needed to handle that message
    """

    messageType  = message[WEBSOCKET_MESSAGE_TYPE]
    if not auth.AuthMessage(self.scope['user'], messageType):
      await self.HandleInsufficientPermissions(message)
      return
    if messageType == WEBSOCKET_MESSAGE_GREAT_STATE:
      await self.HandleTheGreatStateMessage(message)
    elif messageType == WEBSOCKET_MESSAGE_CREATE_DATA_CLASS:
      await self.HandleCreateDataClass(message)
    elif messageType == WEBSOCKET_MESSAGE_FREE_ORDER:
      await self.HandleFreeOrder(message)
    elif messageType == WEBSOCKET_MESSAGE_MOVE_ORDERS:
      await self.HandleMoveOrders(message)
    elif messageType == WEBSOCKET_MESSAGE_ECHO:
      await self.HandleEcho(message)
    elif messageType == WEBSOCKET_MESSAGE_GET_ORDERS:
      await self.HandleGetOrders(message)
    elif messageType == WEBSOCKET_UPDATE_SERVERCONFIG:
      await self.HandleUpdateServerConfig
    elif messageType == WEBSOCKET_MESSAGE_EDIT_STATE:
      await self.HandleEditState(message)
    elif messageType == WEBSOCKET_MESSAGE_DELETE_DATA_CLASS:
      await self.HandleDeleteDataClass(message)
    elif messageType == WEBSOCKET_MESSAGE_AUTH_LOGIN:
      await self.handleLogin(message)
    elif messageType == WEBSOCKET_MESSAGE_AUTH_LOGOUT:
      await self.handleLogout(message)
    elif messageType == WEBSOCKET_MESSAGE_AUTH_WHOAMI:
      await self.handleWhoAmI(message)


  async def sendEvent(self, event: Dict):
    """
      Send the event to each websocket. Note this function gets call for each websocket connected to the group
    """
    await self.send_json(event)

  async def HandleEcho(self, message : Dict):
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
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
      usergroup = user.UserGroup
      customer = []
    else:
      isAuth = False
      username = ""
      usergroup = 0
      key = ""
      customer = []

    await self.send_json({
      AUTH_USERNAME : username,
      KEYWORD_USERGROUP : usergroup,
      KEYWORD_CUSTOMER : customer,
      AUTH_IS_AUTHENTICATED : isAuth,
      WEBSOCKET_SESSION_ID : key,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGIN,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
    })

  async def handleWhoAmI(self, message):
    user = await get_user(self.scope)
    if isinstance(user, User):
      username = user.username
      isAuth = True
      usergroup = user.UserGroup
      #queryCustomers = await database_sync_to_async(user.Customer.all)()
      customer = []
    else:
      isAuth = False
      username = ""
      usergroup = 0
      customer = []

    await self.send_json({
      AUTH_USERNAME : username,
      KEYWORD_USERGROUP : usergroup,
      KEYWORD_CUSTOMER : customer,
      AUTH_IS_AUTHENTICATED : isAuth,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
    })


  async def handleLogout(self, message):
    await logout(self.scope)
    await sync_to_async(self.scope['session'].save)()
    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
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
    Employees, Customers, DeliverTimes, Isotopes, Vials, Runs, Orders, T_Orders, Tracers, ServerConfig, Databases, Address = await self.db.getGreatState()

    #Convert Dataclasses to python dict to send over
    Employees    = LMAP(encode, Employees)
    Customers    = LMAP(encode, Customers)
    DeliverTimes = LMAP(encode, DeliverTimes)
    Isotopes     = LMAP(encode, Isotopes)
    Vials        = LMAP(encode, Vials)
    Runs         = LMAP(encode, Runs)
    Orders       = LMAP(encode, Orders)
    T_Orders     = LMAP(encode, T_Orders)
    Tracers      = LMAP(encode, Tracers)
    SerializedDatabases = serialize('json', Databases)
    SerializedAddress = serialize('json', Address)
    SerializedServerConfig = serialize('json', [ServerConfig])

    content = {
      JSON_GREAT_STATE : {
        JSON_ADDRESS          : SerializedAddress,
        JSON_CUSTOMER         : Customers,
        JSON_DATABASE         : SerializedDatabases,
        JSON_DELIVERTIME      : DeliverTimes,
        JSON_EMPLOYEE         : Employees,
        JSON_ISOTOPE          : Isotopes,
        JSON_ACTIVITY_ORDER   : Orders,
        JSON_RUN              : Runs,
        JSON_INJECTION_ORDER  : T_Orders,
        JSON_TRACER           : Tracers,
        JSON_VIAL             : Vials,
        JSON_SERVER_CONFIG    : SerializedServerConfig
      },
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GREAT_STATE,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
    }
    await self.send_json(content)

  async def HandleCreateDataClass(self, message : Dict):
    """Websocket handler function for production data class creation.

    Args:
        message (Dict): received message with the following fields
          WEBSOCKET_DATA     - Dict with fields suficient to create a dataclass
          WEBSOCKET_DATATYPE - Constant specifying the type of data class to be created
          ----- different arguments might be present due to late standardization -----

    Raises:
        ValueError: raised when an unknown WEBSOCKET_DATATYPE is encountered
    """
    dataClass = None
    if message[WEBSOCKET_DATATYPE] == JSON_VIAL:
      dataClass = await self.db.createDataClass(message[WEBSOCKET_DATA], VialDataClass)
    if message[WEBSOCKET_DATATYPE] == JSON_DELIVERTIME:
      dataClass = await self.db.createDataClass(message[WEBSOCKET_DATA], DeliverTimeDataClass)
    if message[WEBSOCKET_DATATYPE] == JSON_ACTIVITY_ORDER:
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
      dataClass = await self.db.createDataClass(skeleton, ActivityOrderDataClass)
    if message[WEBSOCKET_DATATYPE] == JSON_INJECTION_ORDER:
      skeleton = message[WEBSOCKET_DATA]
      deliver_datetime = toDateTime(skeleton[KEYWORD_DELIVER_DATETIME], JSON_DATETIME_FORMAT)
      skeleton[KEYWORD_DELIVER_DATETIME] = deliver_datetime
      skeleton[KEYWORD_USERNAME] = self.scope['user'].username
      dataClass = await self.db.createDataClass(skeleton, InjectionOrderDataClass)
    # Checking for unhandled case
    if 'dataClass' not in locals():
      error_message = f"Unhandled attempt to create a data class: {message[WEBSOCKET_DATATYPE]}"
      raise ValueError(error_message)
    ID = ParseSQLID(dataClass.getIDField())

    await self.channel_layer.group_send(
      self.global_group,{
        WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_DATA : encode(dataClass),
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_DATA_ID : ID,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      }
    )

  async def HandleFreeOrder(self, message : Dict):
    Order      = ActivityOrderDataClass.fromDict(message[JSON_ACTIVITY_ORDER])
    Vials      = [VialDataClass.fromDict(vialDict) for vialDict in message[JSON_VIAL]]
    tracerID   = message[JSON_TRACER]
    updatedVials = []
    updateOrders = []

    serverConfiguration = await self.db.getServerConfiguration()
    if serverConfiguration.LegacyMode:
      PrimaryVial = Vials[0]
      free_datetime = datetime.now()
      Order.status = 3
      Order.frigivet_af = self.scope['user'].OldTracerBaseID
      Order.frigivet_amount = PrimaryVial.activity
      Order.frigivet_datetime =  free_datetime
      Order.volume = PrimaryVial.volume
      Order.batchnr = PrimaryVial.charge
      await self.db.updateDataClass(Order)
      PrimaryVial.order_id = Order.oid
      await self.db.updateDataClass(PrimaryVial)
      updatedVials.append(PrimaryVial)
      DependantOrders = await self.db.freeDependantOrders(Order, self.scope['user'])
      if DependantOrders:
        updateOrders.append(DependantOrders)

      for Vial in Vials[1:]: #The first vial is assoc with the Primary order
        skeleton = {
          KEYWORD_DELIVER_DATETIME : Order.deliver_datetime,
          KEYWORD_STATUS : 3,
          KEYWORD_AMOUNT : 0,
          KEYWORD_AMOUNT_O : 0,
          KEYWORD_TOTAL_AMOUNT : 0,
          KEYWORD_TOTAL_AMOUNT_O : 0,
          KEYWORD_TRACER : tracerID,
          KEYWORD_RUN : Order.run,
          KEYWORD_COID : -1, #Could argue Order.oid
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
        print(f"could not send mail because: {E}")

      await self.channel_layer.group_send(
        self.global_group, {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
            JSON_ACTIVITY_ORDER : LMAP(lambda x: encode(x.toJSON()), updateOrders),
            JSON_VIAL : LMAP(lambda v: encode(v.toJSON()),updatedVials),
            WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
          }
        )
    else:
      print("No LegacyMode is no go")

  async def HandleMoveOrders(self, message : Dict):
    """This handles the moving of order, Most of the calculation are already done by the client.
    So this function operate very similar to UpdateOrders, however there still are some major differences

    It checks if an Orders is "dead" That's: The order doesn't contain any User ordered Activity, nor is there any activity to be delivered at this point in time
    If the order is dead, the server deletes it.

    The second major difference is that it checks a Ghost Order Field is present if it's then it creates a ghost order

    See README for terminologies.

    Args:
        message Dict: A Dict that have been converted from MoveOrder Message
    """
    def IsDead(Order: ActivityOrderDataClass) -> bool: #Helper that can be exported easily if need be
      return Order.amount == 0.0 and Order.total_amount < 1.0

    updatedOrders = message[JSON_ACTIVITY_ORDER]
    GhostOrderSkeleton = message.get(JSON_GHOST_ORDER)
    deadOrders   = []
    returnOrders = [] # this mainly done So I can uniformly update
    if GhostOrderSkeleton:
      ### Create GhostOrder
      ### The Ghost kw should be moved into constants
      deliverTime = toDateTime(GhostOrderSkeleton["GhostOrderDeliverTime"], JSON_DATETIME_FORMAT)
      Customer    = await self.db.getElement(GhostOrderSkeleton["CustomerID"], CustomerDataClass)
      amount_total = float(GhostOrderSkeleton["GhostOrderActivity"])
      amount_total_o = float(GhostOrderSkeleton["GhostOrderActivityOverhead"])
      Tracer = await self.db.getElement(GhostOrderSkeleton["Tracer"], TracerDataClass)
      run = int(GhostOrderSkeleton["GhostOrderRun"])
      username = self.scope['user'].username

      GhostOrder = await self.db.createGhostOrder(
        deliverTime,
        Customer,
        amount_total,
        amount_total_o,
        Tracer,
        run,
        username
      ) # SQLConsumer method
      returnOrders.append(GhostOrder)
      #End GhostOrder IF

    #Update the orders in the Database
    for orderDict in updatedOrders:
      order = ActivityOrderDataClass.fromDict(orderDict)
      if IsDead(order):
        #Delete Orders later
        deadOrders.append(order.oid)
      else:
        if GhostOrderSkeleton:
          if GhostOrderSkeleton["MappedOrder"] == order.oid:
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
      }
    )


  @typeCheckfunc
  async def HandleGetOrders(self, message : Dict):
    client_date = toDateTime(message[WEBSOCKET_DATE][:19], Format=JSON_DATETIME_FORMAT)
    SC = await self.db.getServerConfig()
    startDate = client_date - timedelta(days=SC.DateRange)
    endDate = client_date + timedelta(days=SC.DateRange)
    activityOrders = await self.db.getDataClassRange(startDate, endDate, ActivityOrderDataClass)
    injectionOrders = await self.db.getDataClassRange(startDate, endDate, InjectionOrderDataClass)
    Vials = await self.db.getDataClassRange(startDate, endDate, VialDataClass)

    await self.send_json({
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GET_ORDERS,
      JSON_ACTIVITY_ORDER : [encode(aorder) for aorder in activityOrders],
      JSON_INJECTION_ORDER : [encode(torder) for torder in injectionOrders],
      JSON_VIAL : [encode(vialdc) for vialdc in Vials],
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
    })

  @typeCheckfunc
  async def HandleUpdateServerConfig(self, message : Dict):
    pass

  async def HandleInsufficientPermissions(self, message: Dict):
    await self.send_json({

    })

  @typeCheckfunc
  async def HandleEditState(self, message : Dict):
    dataClass = findDataClass(message[WEBSOCKET_DATATYPE])

    if 'dataClass' not in locals().keys(): # This is a handy way to see if i've set up a dataclass for the data type
      raise ValueError(f"Datatype: {message[WEBSOCKET_DATATYPE]} is unknown to the consumer")

    dataClassInstance = dataClass.fromDict(message[WEBSOCKET_DATA])
    await self.db.updateDataClass(dataClassInstance)

    ID = ParseSQLID(dataClass.getIDField())

    await self.channel_layer.group_send(self.global_group, {
      WEBSOCKET_EVENT_TYPE   : WEBSOCKET_SEND_EVENT,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_EDIT_STATE,
      WEBSOCKET_DATA         : message[WEBSOCKET_DATA],
      WEBSOCKET_DATATYPE     : message[WEBSOCKET_DATATYPE],
      WEBSOCKET_DATA_ID      : ID,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID]
    })

  async def HandleDeleteDataClass(self, message : Dict):
    dataClass = findDataClass(message[WEBSOCKET_DATATYPE])
    data = dataClass(**message[WEBSOCKET_DATA])
    if(self.db.CanDelete(data)):
      ID = ParseSQLID(dataClass.getIDField())

      await self.db.DeleteIDs([data.__getattribute__(ID)], dataClass)

      await self.channel_layer.group_send(self.global_group, {
        WEBSOCKET_EVENT_TYPE   : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
        WEBSOCKET_DATA         : message[WEBSOCKET_DATA],
        WEBSOCKET_DATATYPE     : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_DATA_ID      : ID,
        WEBSOCKET_MESSAGE_ID   : message[WEBSOCKET_MESSAGE_ID],
      })

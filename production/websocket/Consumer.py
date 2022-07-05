"""This module is divided into two parts the consumer and the SQL consumer.
This module handles all websocket messages between the server and all clients
The other module handles all communication between the underlying database and
this client.

Note: This module doesn't scale at large, simply because all users are in
 a single group. So it should not surprise anybody if stuff starts to break
 if this starts to scale.
"""
__author__ = "Christoffer Vilstrup Jensen"

from django.core.serializers import serialize

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from datetime import datetime, date, timedelta
from typing import Dict, List

from api.models import ServerConfiguration
from constants import * # Import the many WEBSOCKET constants
from lib import pdfs
from lib.decorators import typeCheckfunc
from lib.Formatting import FormatDateTimeJStoSQL, toDateTime
from lib.ProductionJSON import encode, decode
from lib.ProductionDataClasses import *
from lib.mail import sendMail
from lib.utils import LMAP

from websocket.DatabaseInterface import DatabaseInterface

import logging

logger = logging.getLogger('DebugLogger')


class Consumer(AsyncJsonWebsocketConsumer):
  channel_name = 'websocket'
  global_group = "Global"

  def __init__(self, db = DatabaseInterface()):
    super().__init__()
    self.db = db

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data: Dict) -> str:
    return encode(text_data)

  @classmethod
  async def decode_json(cls, content):
    return decode(content)

  ### --- Websocket methods --- ####
  async def connect(self):
    self.user = self.scope["user"]
    self.groups.append(self.global_group)

    await self.channel_layer.group_add(
      self.global_group,
      self.channel_name
    )

    await self.accept()
    logger.info(f"User: {self.user.username} connected")

  async def disconnect(self, close_code):

    for group_name in self.groups:
      print(f"Leaving Group: {group_name}")

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
    logger.info(message)
    #dateStr      = message[WEBSOCKET_DATE] # mostly used on the front end
    messageType  = message[WEBSOCKET_MESSAGE_TYPE]
    if messageType == WEBSOCKET_MESSAGE_GREAT_STATE:
      await self.HandleTheGreatStateMessage()
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

  async def sendEvent(self, event: Dict):
    """
      Send the event to each websocket. Note this function gets call for each websocket connected to the group
    """
    await self.send_json(event)

  async def HandleEcho(self, message : Dict):
    await self.send_json({WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO})

  async def HandleTheGreatStateMessage(self):
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
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GREAT_STATE
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
      vial = VialDataClass.fromDict(message[WEBSOCKET_DATA])
      dataClass = await self.db.CreateVial(vial)
    if message[WEBSOCKET_DATATYPE] == JSON_ACTIVITY_ORDER:
      skeleton = message[WEBSOCKET_DATA]
      tracer = TracerDataClass.fromDict(skeleton[JSON_TRACER])
      customer = CustomerDataClass.fromDict(skeleton[JSON_CUSTOMER])
      deliver_datetime = toDateTime(skeleton[JSON_DELIVERTIME], JSON_DATETIME_FORMAT)

      amount = skeleton[KEYWORD_AMOUNT]
      amount_overhead = amount * (1 + customer.overhead / 100.0)
      run = skeleton[JSON_RUN]

      dataClass = await self.db.createOrder(
        deliver_datetime,
        customer,
        float(amount),
        float(amount_overhead),
        tracer,
        run
      )
    if message[WEBSOCKET_DATATYPE] == JSON_INJECTION_ORDER:
      skeleton = message[WEBSOCKET_DATA]
      tracer = TracerDataClass.fromDict(skeleton[JSON_TRACER])
      customer = CustomerDataClass.fromDict(skeleton[JSON_CUSTOMER])
      deliver_datetime = toDateTime(skeleton[JSON_DELIVERTIME], JSON_DATETIME_FORMAT)
      n_injections = skeleton[KEYWORD_INJECTIONS]
      usage = skeleton[KEYWORD_USAGE]
      comment = skeleton[KEYWORD_COMMENT]
      dataClass = await self.db.createInjectionOrder(
        customer,
        tracer,
        deliver_datetime,
        n_injections,
        usage,
        comment,
        self.user
      )

    # Checking for unhandled case
    if dataClass == None:
      error_message = f"Unhandled attempt to create a data class: {message[WEBSOCKET_DATATYPE]}"
      raise ValueError(error_message)
    SQL_ID = dataClass.getIDField()
    if '.' in SQL_ID:
      _ , ID = SQL_ID.split(".")
    else:
      ID = SQL_ID
    await self.channel_layer.group_send(
      self.global_group,{
        WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
        WEBSOCKET_DATA : encode(dataClass),
        WEBSOCKET_DATATYPE : message[WEBSOCKET_DATATYPE],
        WEBSOCKET_DATA_ID : ID
      }
    )

  async def HandleFreeOrder(self, message : Dict):
    Order      = ActivityOrderDataClass.fromDict(message[JSON_ACTIVITY_ORDER])
    Vials      = [VialDataClass.fromDict(vialDict) for vialDict in message[JSON_VIAL]]
    tracerID   = message[JSON_TRACER]

    serverConfiguration = await self.db.getServerConfiguration()
    if serverConfiguration.LegacyMode:
      PrimaryVial = Vials[0]
      UpdatedOrders = await self.db.assignVial(Order, PrimaryVial)
      for Vial in Vials[1:]: #The first vial is assoc with the Primary order
        newOrder = await self.db.createVialOrder(Vial, Order, tracerID)
        Vial.OrderMap = newOrder.oid
        UpdatedOrders.append(newOrder)

      SerlizedUpdatedOrders = LMAP(lambda x: encode(x.toJSON()), UpdatedOrders)

      pdfFilePath = await self.db.createPDF(Order, Vials)
      Customer    = await self.db.getElement(Order.BID, CustomerDataClass)
      try:
        sendMail(pdfFilePath, Customer, Order, serverConfiguration)
      except Exception as E:
        print(f"could not send mail because: {E}")

      await self.channel_layer.group_send(
        self.global_group, {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ORDER,
            JSON_ACTIVITY_ORDER : SerlizedUpdatedOrders,
            JSON_VIAL : LMAP(lambda v: encode(v.toJSON()),Vials)
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
      username = self.user.username

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
    })

  @typeCheckfunc
  async def HandleUpdateServerConfig(self, message : Dict):
    pass

  @typeCheckfunc
  async def HandleEditState(self, message : Dict):
    if message[WEBSOCKET_DATATYPE] == JSON_ACTIVITY_ORDER:
      dataClass = ActivityOrderDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_CUSTOMER:
      dataClass = CustomerDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_DELIVERTIME:
      dataClass = DeliverTimeDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_ISOTOPE:
      dataClass = IsotopeDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_RUN:
      dataClass = RunsDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_TRACER:
      dataClass = TracerDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_VIAL:
      dataClass = VialDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_INJECTION_ORDER:
      dataClass = InjectionOrderDataClass

    if 'dataClass' not in locals().keys(): # This is a handy way to see if i've set up a dataclass for the data type
      raise ValueError(f"Datatype: {message[WEBSOCKET_DATATYPE]} is unknown to the consumer")
    dataClassInstance = dataClass.fromDict(message[WEBSOCKET_DATA])
    await self.db.updateDataClass(dataClassInstance)

    await self.channel_layer.group_send(self.global_group, {
      WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_EDIT_STATE,
      WEBSOCKET_DATA        : message[WEBSOCKET_DATA],
      WEBSOCKET_DATATYPE    : message[WEBSOCKET_DATATYPE],
      WEBSOCKET_DATA_ID     : dataClass.getIDField()
    })
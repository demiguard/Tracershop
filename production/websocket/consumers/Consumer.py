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
from lib.SQL import SQLController as SQL
from lib.utils import LMAP

from websocket.consumers.SQLConsumer import SQLConsumer

import logging

logger = logging.getLogger('DebugLogger')


class Consumer(SQLConsumer):
  channel_name = 'websocket'
  global_group = "Global"

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
    messageType  = message[WEBSOCKET_MESSAGETYPE]
    if messageType == WEBSOCKET_MESSAGE_GREAT_STATE:
      await self.HandleTheGreatStateMessage()
    elif messageType == WEBSOCKET_MESSAGE_CREATE_VIAL:
      await self.HandleCreateVial(message)
    elif messageType == WEBSOCKET_MESSAGE_FREE_ORDER:
      await self.HandleFreeOrder(message)
    elif messageType == WEBSOCKET_MESSAGE_CREATE_ORDER:
      await self.HandleCreateOrder(message)
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
        * T_orders

      Note * indicate that this is something the function doesn't support but will in time.
    """
    Employees, Customers, DeliverTimes, Isotopes, Vials, Runs, Orders, T_Orders, Tracers, ServerConfig, Databases, Address = await self.getGreatState()

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
        JSON_DELIVERTIMES     : DeliverTimes,
        JSON_EMPLOYEES        : Employees,
        JSON_ISOTOPE          : Isotopes,
        JSON_ACTIVITY_ORDER   : Orders,
        JSON_RUNS             : Runs,
        JSON_INJECTION_ORDERS : T_Orders,
        JSON_TRACER           : Tracers,
        JSON_VIALS            : Vials,
        JSON_SERVER_CONFIG    : SerializedServerConfig
      },
      WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_GREAT_STATE
    }
    await self.send_json(content)


  async def HandleCreateVial(self, message : Dict):
    vial = VialDataClass.fromDict(message[WEBSOCKET_DATA_VIAL])
    await self.CreateVial(vial)
    InsertedVial = await self.getVial(vial)
    await self.channel_layer.group_send(
      self.global_group,
      {
        WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_CREATE_VIAL,
        WEBSOCKET_DATA_VIAL   : encode(InsertedVial),
        WEBSOCKET_DATA_ID     : VialDataClass.getIDField(),
      }
    )

  async def HandleEditVial(self, message : Dict):
    vial = VialDataClass.fromDict(message[WEBSOCKET_DATA_VIAL])
    await self.updateDataClass(Vial, VialDataClass)

    await self.channel_layer.group_send(
      self.global_group, {
        WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_EDIT_VIAL,
        WEBSOCKET_DATA_VIAL   : encode(vial)
      }
    )

  async def HandleCreateOrder(self, message : Dict):
    data = message[WEBSOCKET_MESSAGE_CREATE_ORDER]
    amount = data[JSON_AMOUNT]
    customer_dataDict = data[JSON_CUSTOMER]
    tracer = TracerDataClass.fromDict(data[JSON_TRACER])
    customer = CustomerDataClass.fromDict(customer_dataDict)
    production = data[JSON_RUN]
    deliver_datetime = toDateTime(data[JSON_DELIVERTIMES], JSON_DATETIME_FORMAT)

    amount_overhead = amount * (1 + customer.overhead / 100.0)
    run = data[JSON_RUN]

    Order = await self.createOrder(
        deliver_datetime,
        customer,
        float(amount),
        float(amount_overhead),
        tracer,
        run
      )

    SerilizedOrder = [encode(Order.toJSON())]

    await self.channel_layer.group_send(
      self.global_group, {
        WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
        WEBSOCKET_DATA_ORDERS : SerilizedOrder
      }
    )


  async def HandleFreeOrder(self, message : Dict):
    Order      = ActivityOrderDataClass.fromDict(message[WEBSOCKET_DATA_ORDER])
    Vials      = [VialDataClass.fromDict(vialDict) for vialDict in message[WEBSOCKET_DATA_VIALS]]
    tracerID   = message[WEBSOCKET_DATA_TRACER]

    serverConfiguration = await self.getServerConfiguration()
    if serverConfiguration.LegacyMode:
      PrimaryVial = Vials[0]
      UpdatedOrders = await self.assignVial(Order, PrimaryVial)
      for Vial in Vials[1:]: #The first vial is assoc with the Primary order
        newOrder = await self.createVialOrder(Vial, Order, tracerID)
        Vial.OrderMap = newOrder.oid
        UpdatedOrders.append(newOrder)

      SerlizedUpdatedOrders = LMAP(lambda x: encode(x.toJSON()), UpdatedOrders)

      pdfFilePath = await self.createPDF(Order, Vials)
      Customer    = await self.getElement(Order.BID, CustomerDataClass)
      try:
        sendMail(pdfFilePath, Customer, Order, serverConfiguration)
      except Exception as E:
        print(f"could not send mail because: {E}")

      await self.channel_layer.group_send(
        self.global_group,
        {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
            WEBSOCKET_DATA_ORDERS : SerlizedUpdatedOrders,
            WEBSOCKET_DATA_VIALS : LMAP(lambda v: encode(v.toJSON()),Vials)
          }
        )
    else:
      print("No LegacyMode is no go")

  async def HandleUpdateOrder(self, message : Dict):
    updatedOrders = message[WEBSOCKET_DATA_ORDERS]
    returnOrders = [] # this mainly done So I can uniformly update
      #Update the orders in the Database
    for orderDict in updatedOrders:
      order = ActivityOrderDataClass.fromDict(orderDict)
      returnOrders.append(order)
      await self.updatedOrder(order)
    await self.channel_layer.group_send(
      self.global_group, {
        WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
        WEBSOCKET_DATA_ORDERS : [encode(rOrder) for rOrder in returnOrders]
      }
    )

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
      Customer    = await self.getElement(GhostOrderSkeleton["CustomerID"], CustomerDataClass)
      amount_total = float(GhostOrderSkeleton["GhostOrderActivity"])
      amount_total_o = float(GhostOrderSkeleton["GhostOrderActivityOverhead"])
      Tracer = await self.getElement(GhostOrderSkeleton["Tracer"], TracerDataClass)
      run = int(GhostOrderSkeleton["GhostOrderRun"])
      username = self.user.username

      GhostOrder = await self.createGhostOrder(
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
        deadOrders.append(order.oid)
        #self.deleteOrder(Order)
      else:
        if GhostOrderSkeleton:
          if GhostOrderSkeleton["MappedOrder"] == order.oid:
            order.COID = GhostOrder.oid

        returnOrders.append(order)
        await self.updatedOrder(order)

    if deadOrders: await self.deleteActivityOrders(deadOrders)

    await self.channel_layer.group_send(
      self.global_group, {
        WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
        WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_MOVE_ORDERS,
        WEBSOCKET_DATA_ORDERS : [encode(rOrder) for rOrder in returnOrders],
        WEBSOCKET_DATA_DEAD_ORDERS : deadOrders, # This is a list of OID so no need to encode this
      }
    )

  async def HandleEditTracer(self, message:Dict):
    tracer = TracerDataClass.fromDict(message[JSON_TRACER])
    await self.updateDataClass(tracer)
    await self.channel_layer.group_send(self.global_group,{
      WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
      WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_EDIT_TRACER,
      WEBSOCKET_DATA_TRACER : [encode(tracer)]
    })

  async def HandleEcho(self, message : Dict):
    await self.send_json({WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_ECHO})

  @typeCheckfunc
  async def HandleGetOrders(self, message : Dict):
    client_date = toDateTime(message[WEBSOCKET_DATE][:19], Format=JSON_DATETIME_FORMAT)
    SC = await self.getServerConfig()
    startDate = client_date - timedelta(days=SC.DateRange)
    endDate = client_date + timedelta(days=SC.DateRange)
    activityOrders = await self.getDataClassRange(startDate, endDate, ActivityOrderDataClass)
    injectionOrders = await self.getDataClassRange(startDate, endDate, InjectionOrderDataClass)
    Vials = await self.getDataClassRange(startDate, endDate, VialDataClass)

    await self.send_json({
      WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_GET_ORDERS,
      WEBSOCKET_DATA_ORDERS : [encode(aorder) for aorder in activityOrders],
      WEBSOCKET_DATA_T_ORDERS : [encode(torder) for torder in injectionOrders],
      WEBSOCKET_DATA_VIALS : [encode(vialdc) for vialdc in Vials],
    })

  @typeCheckfunc
  async def HandleUpdateServerConfig(self, message : Dict):
    pass

  @typeCheckfunc
  async def HandleEditState(self, message : Dict):

    if message[WEBSOCKET_DATATYPE] == JSON_ACTIVITY_ORDER:
      dataclass = ActivityOrderDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_CUSTOMER:
      dataClass = CustomerDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_DELIVERTIMES:
      dataClass = DeliverTimeDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_ISOTOPE:
      dataClass = IsotopeDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_RUN:
      dataclass = RunsDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_TRACER:
      dataClass = TracerDataClass
    elif message[WEBSOCKET_DATATYPE] == JSON_VIALS:
      dataClass = VialDataClass

    if 'dataClass' not in locals().keys(): # This is a handy way to see if i've set up a dataclass for the data type
      raise ValueError(f"Datatype: {message[WEBSOCKET_DATATYPE]} is unknown to the consumer")
    dataClassInstance = dataClass.fromDict(message[WEBSOCKET_DATA])
    await self.updateDataClass(dataClassInstance)

    await self.channel_layer.group_send(self.global_group, {
      WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
      WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_EDIT_STATE,
      WEBSOCKET_DATA        : message[WEBSOCKET_DATA],
      WEBSOCKET_DATATYPE    : message[WEBSOCKET_DATATYPE],
      WEBSOCKET_DATA_ID     : dataClass.getIDField()
    })
from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from datetime import datetime
from typing import Dict, List
from lib.decorators import typeCheckfunc
from lib.utils import LMAP
from lib.ProductionJSON import encode, decode
from lib.ProductionDataClasses import ActivityOrderDataClass, VialDataClass
from lib.mail import sendMail
from lib.SQL import SQLController as SQL
from api.models import ServerConfiguration
from constants import * # Import the many WEBSOCKET constants
from lib import pdfs

class ActivityOrderConsumer(AsyncJsonWebsocketConsumer):
  channel_name = 'Activity'

  def __init__(self, SQL_Controller=SQL.SQL()):
    self.SQL = SQL_Controller
    super().__init__()

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data: Dict) -> str:
    return encode(text_data)
  
  @classmethod
  async def decode_json(cls, content):
    return decode(content)

  ### --- Websocket methods --- ####
  async def connect(self):
    self.group_name = self.scope['url_route']['kwargs']['tracer_id'] # Tracer id
    self.user = self.scope["user"]

    await self.channel_layer.group_add(
      self.group_name,
      self.channel_name
    )

    await self.accept()

  async def disconnect(self, close_code):
    await self.channel_layer.group_discard(
      self.group_name,
      self.channel_name
    )

  #Receive data from Websocket
  async def receive_json(self, message: Dict) -> None:
    """
      This is the server side handler for new message. It assumes the text data is on json format with the following entries:
        messageType - This is the indentifier for which type of message was send.
        date        - This message indicate what date it was send. It's used on the front end to discard messages, that's is not relevant
                    / This would normaly be different groups that you sign up to instead, but since i'm expecting only a few users are on site.
                    / Note that different group would probally require the websockets to drop / enter new group dynamicly. 
                    / The point is, the way stuff is done is not optimal, but sufficient given the current usecase
    
    """
    print("Websocket RECIEVE:\n",message) # Debug message 
    print("User:", self.user)
    dateStr      = message[WEBSOCKET_DATE] # Only used on the front end
    messageType  = message[WEBSOCKET_MESSAGETYPE]

    if messageType == WEBSOCKET_MESSAGE_UPDATEORDERS:
      updatedOrders = message[WEBSOCKET_DATA_ORDERS]
      returnOrders = [] # this mainly done So I can uniformly update
      #Update the orders in the Database
      for orderDict in updatedOrders:
        order = ActivityOrderDataClass.fromDict(orderDict)
        returnOrders.append(order)
        await self.updatedOrder(order)
      await self.channel_layer.group_send(
        self.group_name,
        {
          WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
          WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
          WEBSOCKET_DATE        : dateStr,
          WEBSOCKET_DATA_ORDERS : [encode(rOrder) for rOrder in returnOrders]
        }
      )
    if messageType == WEBSOCKET_MESSAGE_CREATE_VIAL:
      vial = VialDataClass.fromDict(message[WEBSOCKET_DATA_VIAL])
      await self.CreateVial(vial)
      InsertedVial = await self.getVial(vial)
      await self.channel_layer.group_send(
        self.group_name,
        {
          WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
          WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_CREATE_VIAL,
          WEBSOCKET_DATE        : dateStr,
          WEBSOCKET_DATA_VIAL   : encode(InsertedVial)
        }
      )
    if messageType == WEBSOCKET_MESSAGE_EDIT_VIAL:
      vial = VialDataClass.fromDict(message[WEBSOCKET_DATA_VIAL]) # Dict Vial Form
      await self.updateVial(vial)

      await self.channel_layer.group_send(
        self.group_name,
        {
          WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
          WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_EDIT_VIAL,
          WEBSOCKET_DATE        : dateStr,
          WEBSOCKET_DATA_VIAL   : encode(vial)
        }
      )
    if messageType == WEBSOCKET_MESSAGE_FREE_ORDER:
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

        await self.channel_layer.group_send(
          self.group_name,
          {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
            WEBSOCKET_DATE : dateStr,
            WEBSOCKET_DATA_ORDERS : SerlizedUpdatedOrders,
            WEBSOCKET_DATA_VIALS : LMAP(lambda v: encode(v.toJSON()),Vials)
          }
        )
      else:
        print("No LegacyMode is no go")
      pdfFilePath = await self.createPDF(Order, Vials)
      Customer    = await self.getCustomer(Order.BID)
      self.send_mail(pdfFilePath, Customer, Order)
      


  async def sendEvent(self, event: Dict):
    """
      Send the event to each websocket. Note this function gets call for each websocket connected to the group 
    """
    await self.send_json(event)

  #Database handlers
  @database_sync_to_async
  def updatedOrder(
      self,
      order: ActivityOrderDataClass
    ) -> ActivityOrderDataClass:
    """[summary]

    Args:
        order (ActivityOrderDataClass): [description]

    Returns:
        ActivityOrderDataClass: [description]
    """
    self.SQL.updateOrder(order)

  @database_sync_to_async
  def CreateVial(self, Vial : VialDataClass) -> None:
    self.SQL.createVial(Vial)
      
  @database_sync_to_async
  def getVial(self, Vial : VialDataClass) -> VialDataClass:
    """
      This takes an incomplete VialDataClass and fills the data in it
    
      Args:
        Vial - VialDataClass - the incomplete VialDataClass
      return
        VialDataClass - a new VialDataClass with more fields, 
                        if the field was precent in the old vial
                        it's the same in the new
    """
    return self.SQL.getVial(Vial)

  @database_sync_to_async
  def updateVial(self, Vial : VialDataClass) -> None:
    """
      Overwrite the database Vial with this database object
      Note this doesn't affect Vial Mapping 
    """
    self.SQL.updateVial(Vial)
    
  @database_sync_to_async
  def getServerConfiguration(self) -> ServerConfiguration:
    """Get the server configuration

    Returns:
        ServerConfiguration: the server configuration Instance
    """
    return self.SQL.getServerConfig()

  @database_sync_to_async
  def getCustomer(self, BID : int):
    return self.SQL.getCustomer(BID)


  @database_sync_to_async
  def assignVial(self, 
      Order : ActivityOrderDataClass,
      Vial : VialDataClass
    ) -> List[ActivityOrderDataClass]:
    """Fills an order with data from the vialID given

      Args:
        Order  : ActivityOrderDataClass, is the order the vial is being assigned to
        VialID : VialDataClass, corosponding to the vial that is being assigned

      Returns:
        List[ActivityOrderDataClass] : List of modified orders 
    """
    #Order Changes:
    Order.frigivet_datetime = datetime.now()
    Order.frigivet_amount   = Vial.activity
    Order.frigivet_af = self.user.OldTracerBaseID
    Order.volume = Vial.volume
    Order.batchnr = Vial.charge

    #Vial Changes
    Vial.OrderMap = Order.oid
    
    return self.SQL.FreeOrder(Order, Vial, self.user)
    
  @database_sync_to_async
  @typeCheckfunc
  def createVialOrder(
      self, 
      Vial: VialDataClass, 
      OriginalOrder: ActivityOrderDataClass, 
      tracerID : int
    ) -> ActivityOrderDataClass:
    """
      Creates an "empty" Order to indicate that an order was assigned multiple Vials

      returns 
        ActivityOrderClass: The order created
    """
    return self.SQL.CreateNewFreeOrder(OriginalOrder, Vial, tracerID, self.user) 

  @database_sync_to_async
  def createPDF(
    self, 
    Order: ActivityOrderDataClass, 
    Vials: List[VialDataClass]
  ):
    customer = self.SQL.getCustomer(Order.BID)
    Tracer, Isotope = self.SQL.getTracerAndIsotope(Order.tracer)
    pdfPath = pdfs.getPdfFilePath(customer, Order)
    pdfs.DrawSimpleActivityOrder(pdfPath, customer, Order, Vials, Tracer, Isotope)
    return pdfPath

  @database_sync_to_async
  def send_mail(self, pdfFilePath, Customer, Order):
    sendMail(pdfFilePath, Customer, Order)
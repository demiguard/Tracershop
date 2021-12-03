from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from datetime import datetime
from typing import Dict, List
from lib.ProductionJSON import encode, decode
from lib.ProductionDataClasses import ActivityOrderDataClass, VialDataClass
from lib.SQL import SQLController as SQL
from constants import * # Import the many WEBSOCKET constants

class ActivityOrderConsumer(AsyncJsonWebsocketConsumer):
  channel_name = 'Activity'

  def __init__(self, SQL_Controller=SQL.SQL()):
    self.SQL = SQL_Controller
    super().__init__()

  ### --- JSON methods --- ###
  @classmethod
  async def encode_json(cls, text_data):
    return encode(text_data)
  
  @classmethod
  async def decode_json(cls, content):
    return decode(content)

  ### --- Websocket methods --- ####
  async def connect(self):
    self.group_name = self.scope['url_route']['kwargs']['tracer_id'] # Tracer id
    
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
  async def receive_json(self, message):
    """
      This is the server side handler for new message. It assumes the text data is on json format with the following entries:
        messageType - This is the indentifier for which type of message was send.
        date        - This message indicate what date it was send. It's used on the front end to discard messages, that's is not relevant
                    / This would normaly be different groups that you sign up to instead, but since i'm expecting only a few users are on site.
                    / Note that different group would probally require the websockets to drop / enter new group dynamicly. 
                    / The point is, the way stuff is done is not optimal, but sufficient given the current usecase
    
    """
    print("Websocket RECIEVE:\n",message) # Debug message 
    
    dateStr      = message[WEBSOCKET_DATE] # Only used on the front end
    messageType  = message[WEBSOCKET_MESSAGETYPE]

    if messageType == WEBSOCKET_MESSAGE_UPDATEORDERS:
      updatedOrders = message[WEBSOCKET_DATA_ORDERS]
      returnOrders = [] # this mainly done So I can uniformly update
      #Update the orders in the Database
      for orderdict in updatedOrders:
        order = ActivityOrderDataClass.fromDict(orderDict)
        returnOrders.append(order)
        await self.updatedOrder(order)
      await self.channel_layer.group_send(
        self.group_name,
        {
          WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
          WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
          WEBSOCKET_DATE        : dateStr,
          WEBSOCKET_DATA_ORDERS : returnOrders
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
      vial = message[WEBSOCKET_DATA_VIAL] # Dict Vial Form
      await self.updateVial(vial)

      await self.channel_layer.group_send(
        self.group_name,
        {
          WEBSOCKET_EVENT_TYPE  : WEBSOCKET_SEND_EVENT,
          WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_EDIT_VIAL,
          WEBSOCKET_DATE        : dateStr,
          WEBSOCET_DATA_VIAL    : vial
        }
      )
    if messageType == WEBSOCKET_MESSAGE_FREE_ORDER:
      Order      = message[WEBSOCKET_DATA_ORDER]
      Vials      = message[WEBSOCKET_DATA_VIALS]
      tracerID   = message[WEBSOCKET_DATA_TRACER]

      serverConfiguration = await self.getServerConfiguration()
      if serverConfiguration.LegacyMode:
        Vials.reverse() # this is to get the first element last
        headerVialID = Vials.pop()
        UpdatedOrders = await self.assignVial(Order, headerVialID)
        for VialID in Vials:
          newOrder = await self.createVialOrder(VialID, Order, tracerID)
          UpdatedOrders.append(newOrder)
        
        SerlizedUpdatedOrders = list(map(lambda x: encode(x.toJSON()), UpdatedOrders))

        await self.channel_layer.group_send(
          self.group_name,
          {
            WEBSOCKET_EVENT_TYPE : WEBSOCKET_SEND_EVENT,
            WEBSOCKET_MESSAGETYPE : WEBSOCKET_MESSAGE_UPDATEORDERS,
            WEBSOCKET_DATE : dateStr,
            WEBSOCKET_DATA_ORDERS : SerlizedUpdatedOrders 
          }
        )
      else:
        print("LegacyMode is no go")
      print("this printstatement sends a mail")


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
    self.SQL.UpdateOrder(order)

  @database_sync_to_async
  def CreateVial(self, Vial : VialDataClass) -> None:
    SQL.createVial(Vial)
      
  @database_sync_to_async
  def FillVial(self, Vial : VialDataClass) -> VialDataClass:
    """
      This takes an incomplete VialDataClass and fills the data in it
    
      Args:
        Vial - VialDataClass - the incomplete VialDataClass
      return
        VialDataClass - a new VialDataClass with more fields, 
                        if the field was precent in the old vial
                        it's the same in the new
    """
    return SQL.getVial(Vial)

  @database_sync_to_async
  def updateVial(self, Vial : VialDataClass) -> None:
    """
      Overwrite the database Vial with this database object
      Note this doesn't affect Vial Mapping 
    """
    SQL.updateVial(Vial)
    
  @database_sync_to_async
  def getServerConfiguration(self):
    return SQL.getServerConfig()

  @database_sync_to_async
  def assignVial(self, 
      Order : ActivityOrderDataClass,
      Vial : VialDataClass
    ) -> List[ActivityOrderDataClass]:
    """
      Fills an order with data from the vialID given

      Args:
        Order  : ActivityOrderDataClass, is the order the vial is being assigned to
        VialID : VialDataClass, corosponding to the vial that is being assigned
      returns
        List[ActivityOrderDataClass] : List of modified orders 
    """
    return SQL.FreeOrder(Order, VialData)
    

  @database_sync_to_async
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
    return SQL.CreateNewFreeOrder(VialData, OriginalOrder, tracerID) 
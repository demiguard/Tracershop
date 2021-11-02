import json

from asgiref.sync import async_to_sync

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from lib.SQL import SQLController as SQL

class FDGConsumer(AsyncWebsocketConsumer):
  FDG_group_name   = 'FDG' 
  FDG_channel_name = 'FDG'
  
  async def connect(self):
    await self.channel_layer.group_add(
      self.FDG_group_name,
      self.channel_name
    )

    await self.accept()

  async def disconnect(self, close_code):
    await self.channel_layer.group_add(
      self.FDG_group_name,
      self.channel_name
    )

  #Receive data from Websocket
  async def receive(self, text_data): 
    """
      This is the server side handler for new message. It assumes the text data is on json format with the following entries:
        messageType - This is the indentifier for which type of message was send.
        date        - This message indicate what date it was send. It's used on the front end to discard messages, that's is not relevant
                    / This would normaly be different groups that you sign up to instead, but since i'm expecting only a few users are on site.
                    / Note that different group would probally require the websockets to drop / enter new group dynamicly. 
                    / The point is, the way stuff is done is not optimal, but sufficient given the current usecase
    
    """

    print("Websocket RECIEVE " + text_data)
    message = text_data
    message_json = json.loads(message)
    
    dateStr      = message_json["date"] # Only used on the front end
    messageType  = message_json["messageType"]

    if messageType == "AcceptOrder":
      oid = message_json["oid"]
      await self.setFDGOrderStatusTo2(oid)
      await self.channel_layer.group_send(
        self.FDG_channel_name,
        {
          "type" : 'sendEvent',
          "messageType" : "AcceptOrder",
          "date"        : dateStr,
          "oid"         : oid
        }
      )
    if messageType == "ChangeRun":
      updatedOrders = message_json["UpdatedOrders"]
      #Update the orders in the Database
      for order in updatedOrders:
        await self.updatedOrder(order)
      await self.channel_layer.group_send(
        self.FDG_channel_name,
        {
          "type" : 'sendEvent',
          "messageType" : "ChangeRun",
          "date"        : dateStr,
          "UpdatedOrders" : updatedOrders
        }
      )
    if messageType == "CreateVial":
      vial = message_json["vial"]
      await self.CreateVial(vial)
      InsertedVial = await self.getVial(vial)
      await self.channel_layer.group_send(
        self.FDG_channel_name,
        {
          "type" : 'sendEvent',
          "messageType" : "CreateVial",
          "date"        : dateStr,
          "vial"        : InsertedVial
        }
      )
    if messageType == "EditVial":
      vial = message_json["vial"]
      await self.updateVial(vial)
      await self.channel_layer.group_send(
        self.FDG_channel_name,
        {
          "type"        : "sendEvent",
          "messageType" : "EditVial",
          "date"        : dateStr,
          "vial"        : vial
        }
      )

  async def sendEvent(self, event):
    """
      Send the event to each websocket. Note this function gets call for each websocket connected to the group 
    """
    await self.send(text_data=json.dumps(event))

  #Database handlers
  @database_sync_to_async
  def updatedOrder(self, order):
    SQL.UpdateOrder(order)

  @database_sync_to_async
  def setFDGOrderStatusTo2(self, oid):
    SQL.setFDGOrderStatusTo2(oid)

  @database_sync_to_async
  def CreateVial(self, Vial):
    SQL.createVial(
      Vial["customer"], 
      Vial["charge"],
      Vial["filldate"],
      Vial["filltime"],
      Vial["volume"],
      Vial["activity"]
    )
  
  @database_sync_to_async
  def getVial(self, Vial):
    return SQL.getVial(
      CustomerID=Vial["customer"], 
      Charge=Vial["charge"],
      FillDate=Vial["filldate"],
      FillTime=Vial["filltime"],
      Volume=Vial["volume"],
      activity=Vial["activity"]
    )

  @database_sync_to_async
  def updateVial(self, Vial):
    SQL.updateVial(
      ID=Vial["ID"],
      CustomerID=Vial["customer"], 
      Charge=Vial["charge"],
      FillDate=Vial["filldate"],
      FillTime=Vial["filltime"],
      Volume=Vial["volume"],
      activity=Vial["activity"]
    )
    
    

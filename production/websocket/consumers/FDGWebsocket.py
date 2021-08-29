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
    print("Closing Websocket")


  #Receive data from Websocket
  async def receive(self, text_data): 
    print("Websocket RECIEVE "+text_data)
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
          "type" : 'AcceptOrder',
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
          "type" : 'ChangeRun',
          "messageType" : "ChangeRun",
          "date"        : dateStr,
          "UpdatedOrders" : updatedOrders
        }
      )

  #These functions are called for each Websocket
  async def ChangeRun(self, event):
    await self.send(text_data=json.dumps(event))


  #Recieve data from channel
  async def AcceptOrder(self, event):
    await self.send(text_data=json.dumps(event))

  #Database handlers
  @database_sync_to_async
  def updatedOrder(self, order):
    SQL.UpdateOrder(order)

  @database_sync_to_async
  def setFDGOrderStatusTo2(self, oid):
    SQL.setFDGOrderStatusTo2(oid)


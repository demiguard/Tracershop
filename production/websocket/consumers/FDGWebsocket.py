import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from lib.SQL import SQLController as SQL

class FDGConsumer(WebsocketConsumer):
  FDG_group_name   = 'FDG' 
  FDG_channel_name = 'FDG'
  
  def connect(self):
    async_to_sync(self.channel_layer.group_add)(
      self.FDG_group_name,
      self.channel_name
    )

    self.accept()

  def disconnect(self, close_code):
    async_to_sync(self.channel_layer.group_add)(
      self.FDG_group_name,
      self.channel_name
    )
    print("Closing Websocket")


  #Receive data from Websocket
  def receive(self, text_data):
    print("Websocket RECIEVE "+text_data)
    message = text_data
    message_json = json.loads(message)
    
    dateStr      = message_json["date"] # Only used on the front end
    messageType  = message_json["messageType"]

    if messageType == "AcceptOrder":
      oid = message_json["oid"]
      async_to_sync(self.channel_layer.group_send)(
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
      async_to_sync(self.channel_layer.group_send)(
        self.FDG_channel_name,
        {
          "type" : 'ChangeRun',
          "messageType" : "ChangeRun",
          "date"        : dateStr,
          "UpdatedOrders" : updatedOrders
        }
      )


  def ChangeRun(self, event):
    updatedOrders = event["UpdatedOrders"]
    #Update the orders in the Database
    for order in updatedOrders:
      SQL.UpdateOrder(order)
    self.send(text_data=json.dumps(event))


  #Recieve data from channel
  def AcceptOrder(self, event):
    SQL.setFDGOrderStatusTo2(event["oid"])
    self.send(text_data=json.dumps(event))
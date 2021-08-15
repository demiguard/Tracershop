import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from lib.SQL import SQLController as SQL

class TOrderConsumer(WebsocketConsumer):
  tOrders_group_name   = 'tOrders' 
  tOrders_channel_name = 'tOrders'

  def connect(self):
    async_to_sync(self.channel_layer.group_add)(
      self.tOrders_group_name,
      self.channel_name
    )

    self.accept()
  
  def disconnect(self, close_code):
    async_to_sync(self.channel_layer.group_add)(
      self.tOrders_group_name,
      self.channel_name
    )
    print("Closing T Order Websocket")

  def receive(self, text_data):
    print("Websocket RECIEVE "+text_data)
    message = text_data
    message_json = json.loads(message)
    
    dateStr      = message_json["date"] # Only used on the front end
    messageType  = message_json["messageType"]
  
    print(message_json)

    if messageType == "changeStatus":
      oid = message_json["oid"]
      status = message_json["status"]
      SQL.setTOrderStatus(oid, status)
      async_to_sync(self.channel_layer.group_send)(
        self.tOrders_channel_name,
        {
          "type"        : "changeStatus",
          "messageType" : "changeStatus",
          "date"        : dateStr,
          "oid"         : oid,
          "status"      : status
        })
      
  def changeStatus(self, event):
    #This code is called for each group members, So don't have code with sideeffects that effect more than the targeted websocket

    


    self.send(text_data=json.dumps(event))


  

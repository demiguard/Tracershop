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


  #Receive data from Websocket
  def receive(self, text_data):
    text_data_json = json.loads(text_data)
    message = text_data_json["newOrders"]
    dateStr = text_data_json["date"]
    messageType  = text_data_json["messageType"]
    if messageType == "AcceptOrder":
      updatedOrder = text_data_json["updatedOrder"]
      print(updatedOrder)
      SQL.setFDGOrderStatusTo2(updatedOrder["oid"])




    async_to_sync(self.channel_layer.group_send)(
      self.FDG_channel_name,
      {
        "type" : 'ChannelMessage',
        "newOrders" : message,
        "date"      : dateStr
      }
    )


  #Recieve data from channel
  def ChannelMessage(self, event):
    newOrders = event['newOrders']
    dateStr   = event['date']

    self.send(text_data=json.dumps({
      'newOrders' :  newOrders,
      'date'      :  dateStr
    }))
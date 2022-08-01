""" These test are the end-to-end tests for the websocket

This means that this is an indirect test of:
    * DatabaseInterface
    * SQLController
    * SQLFactory
    * SQLExecuter
    * ProductionDataclasses
    * ProductionJSON
"""
from channels.auth import AuthMiddlewareStack
from channels.routing import URLRouter, ProtocolTypeRouter
from channels.testing import WebsocketCommunicator

from django.core import serializers
from django.core.asgi import get_asgi_application
from django.test import TestCase
from django.urls import re_path

from asgiref.sync import sync_to_async
from json import loads
from pprint import pprint

from api.models import ServerConfiguration
from api.ModelsDir.NetworkModels import Address, Database
from constants import *
from tests.test_DataClasses import * # This file standizes the dataclasses
from lib.ProductionDataClasses import CustomerDataClass, DeliverTimeDataClass
from lib.SQL.SQLExecuter import ExecuteQuery, ExecuteManyQueries, Fetching
from websocket.DatabaseInterface import DatabaseInterface
from websocket.Consumer import Consumer
from tests.helpers import getModel

django_asgi_app = get_asgi_application()

from websocket import routing # Import that this line is here, otherwise load order is fucked up

app = ProtocolTypeRouter({
  "http" : django_asgi_app,
  "websocket" : AuthMiddlewareStack(
    URLRouter([re_path(r'ws/$', Consumer.as_asgi())])
  )
})



#NOTE: that sadly the connection cannot be in a setup case,
# due to it being in different event loop
class ConsumerTestCase(TestCase):
    message_id = 6942069
    dbI = DatabaseInterface()
    # Dataclasses
    async def test_connect_to_consumer(self):
        comm = WebsocketCommunicator(app,"ws/")
        conn, subprotocal = await comm.connect()
        self.assertTrue(conn)
        await comm.disconnect()

    async def test_echo(self):
        comm = WebsocketCommunicator(app,"ws/")
        conn, subprotocal = await comm.connect()
        await comm.send_json_to({
            WEBSOCKET_MESSAGE_ID : self.message_id,
            WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_ECHO
        })

        response = await comm.receive_json_from()
        await comm.disconnect()

    @UseDataClass(CustomerDataClass, DeliverTimeDataClass, IsotopeDataClass, RunsDataClass)
    async def test_GreatState(self):
        # Database setup
        #await InsertCustomers()

        # Connection Setup
        comm = WebsocketCommunicator(app,"ws/")
        conn, subprotocal = await comm.connect()
        # Test
        await comm.send_json_to({
            WEBSOCKET_MESSAGE_ID : self.message_id,
            WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_GREAT_STATE
        })
        response = await comm.receive_json_from()
        GreatState = response[JSON_GREAT_STATE]
        pprint(GreatState)
        # Decoding
        address = [model.object for model in serializers.deserialize("json", GreatState[JSON_ADDRESS])]
        database = [model.object for model in serializers.deserialize("json", GreatState[JSON_DATABASE])]
        serverConfig = [model.object for model in serializers.deserialize("json", GreatState[JSON_SERVER_CONFIG])]
        #Legacy
        #Dataclasses are double encoded.
        Customers = [CustomerDataClass(**loads(loads(customerJson))) for customerJson in GreatState[JSON_CUSTOMER]]

        # Validation
        self.assertEqual(len(address),1)
        self.assertEqual(len(database),1)
        self.assertEqual(len(serverConfig),1)
        self.assertEqual(address[0], await getModel(Address, 1))
        self.assertEqual(database[0], await getModel(Database, "test_tracershop"))
        self.assertEqual(serverConfig[0], await getModel(ServerConfiguration, 1))

        self.assertListEqual(Customers, testCustomers)

        # Database Teardown
        #await RemoveCustomers()
""" These tests validates that the legacy database &
  django database is set up correctly


"""
import collections
import mysql.connector as mysql

from django.test import TestCase
from django import db

from api.models import Database, Address, ServerConfiguration
from lib.SQL import SQLExecuter
from lib.SQL.SQLController import SQL
import constants

class InitialSetupTestCase(TestCase):
  def test_django_databases(self):
    addresses = Address.objects.all()
    databases = Database.objects.all()
    SC = ServerConfiguration.objects.all()

    self.assertEqual(len(addresses), 1)
    self.assertEqual(len(databases), 1)
    self.assertEqual(len(SC), 1)

    address = addresses[0]
    database = databases[0]
    SC = SC[0]

    self.assertEqual(address.ip, "127.0.0.1")
    self.assertEqual(address.port, "3306")

    self.assertEqual(database.address, address)
    self.assertEqual(SC.ExternalDatabase, database)



  def test_legacy_tables_availability(self):
    """
      Note there's extra tables in there however they are not used by this program
      NOTE: This test should not use SQLExecuter, but instead manually do the connection instead of using the wrapper
    """
    tables_query = [ item for (item,) in SQLExecuter.ExecuteQuery("""SHOW TABLES""")]

    self.assertSetEqual(set(tables_query), constants.LEGACY_TABLES)
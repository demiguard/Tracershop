""" These tests validates that the legacy database &
  django database is set up correctly
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from unittest import skip

# Third party packages
from django import db
from django.test import TestCase
import mysql.connector as mysql

# Tracershop Production packages
import constants
from database.models import Database, Address, ServerConfiguration
from database.production_database import SQLExecuter
from database.production_database.SQLController import SQL

class InitialSetupTestCase(TestCase):
  @skip
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

  @skip
  def test_legacy_tables_availability(self):
    """
      Note there's extra tables in there however they are not used by this program
      NOTE: This test should not use SQLExecuter, but instead manually do the connection instead of using the wrapper
    """
    tablesQuery = [QueryDict["Tables_in_test_tracershop"]
      for QueryDict in SQLExecuter.ExecuteQuery("""SHOW TABLES""")]

    self.assertSetEqual(set(tablesQuery), constants.LEGACY_TABLES)

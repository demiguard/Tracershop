from datetime import datetime
from django.test import TestCase

from dataclass.ProductionDataClasses import ActivityOrderDataClass, IsotopeDataClass
from database.production_database.SQLFormatter import FormatSQLDictAsClass, SerializeToSQLValue, checkForSQLInjection
from core.exceptions import SQLInjectionException


class SQLFormatterTestCase():
  ActivityOrderDataClassData = {
     "deliver_datetime" : "2022-10-11 11:30:00",
     "oid" : 13337,
     "status" : 3,
     "amount" : 10000,
     "amount_o" : 12000,
     "total_amount" : 10000,
     "total_amount_o" : 12000,
     "tracer" : 1,
     "run" : 2,
     "BID" : 1,
     "batchnr" : "Batchnr",
     "COID" : -1,
     "frigivet_af" : 1,
     "frigivet_amount" : 105348,
     "volume" : 9.12,
     "frigivet_datetime" : "2022-10-11 11:27:12",
     "comment" : "Test Comment",
     "username" : "TestUser",
  }

  def test_FormatSQLDictAsClass_ActivtityOrderDataClass(self):
    AODC = FormatSQLDictAsClass([self.ActivityOrderDataClassData], ActivityOrderDataClass)[0]

    self.assertEqual(AODC.deliver_datetime,datetime(2022, 10, 11, 11, 30, 0))
    self.assertEqual(AODC.status, 3)
    self.assertEqual(AODC.amount, 10000)
    self.assertEqual(AODC.amount_o, 12000)
    self.assertEqual(AODC.total_amount, 10000)
    self.assertEqual(AODC.total_amount_o, 12000)
    self.assertEqual(AODC.tracer, 1)
    self.assertEqual(AODC.run, 2)
    self.assertEqual(AODC.BID, 1)
    self.assertEqual(AODC.batchnr, "Batchnr")
    self.assertEqual(AODC.COID, -1)
    self.assertEqual(AODC.frigivet_af, 1)
    self.assertEqual(AODC.frigivet_amount, 105348)
    self.assertEqual(AODC.volume, 9.12)
    self.assertEqual(AODC.comment, "Test Comment")
    self.assertEqual(AODC.username, "TestUser")
    self.assertEqual(AODC.frigivet_datetime, datetime(2022, 10, 11, 11, 27, 12))

  def test_FormatSQLDictAsClass_empty(self):
    self.assertEqual(len(FormatSQLDictAsClass([], ActivityOrderDataClass)), 0)


  def test_SQLInjection(self):
    SQLInjectionQuery = """SELECT * FROM Users WHERE username = \"user\"; DROP DATABASE database"""
    self.assertRaises(SQLInjectionException, checkForSQLInjection, SQLInjectionQuery)

  def test_UnknownSQL(self):
    self.assertRaises(TypeError, SerializeToSQLValue, IsotopeDataClass(ID=3, name="TestIsotope", halflife=964.12))
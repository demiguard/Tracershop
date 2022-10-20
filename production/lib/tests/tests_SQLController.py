""" This is an End to End of the SQL modules. The controller handles:
  * SQLExecuter
  * SQLFactory
  * SQLFormatter
"""
__author__ = "Christoffer Vilstrup Jensen"

from datetime import datetime
from pprint import pprint
from typing import get_args, get_origin, Union
from unittest import skip
from django.test import TestCase

from mysql.connector.errors import InternalError

from asgiref.sync import sync_to_async

from lib.SQL.SQLController import SQL
from lib.SQL import SQLExecuter as Exec
from lib.SQL import SQLFactory as Fact
from lib.ProductionDataClasses import ActivityOrderDataClass, DeliverTimeDataClass
from lib.Formatting import toDateTime
from tests.test_DataClasses import useDataClass, testOrders
from tests.helpers import cleanTable


class SQLControllerTestCase(TestCase):
  SQL = SQL()
  activityOrderStatus2 = [("deliver_datetime","2022-10-11 11:30:00"),
      ("oid", 1337),
      ("status", 2),
      ("amount", 10000),
      ("amount_o", 12000),
      ("total_amount", 10000),
      ("total_amount_o", 12000),
      ("tracer", 1),
      ("run", 2),
      ("BID", 1),
      ("batchnr", ""),
      ("COID", -1),
    ]
  activityOrderStatus3 = [ ("deliver_datetime","2022-10-11 11:30:00"),
      ("oid", 13337),
      ("status", 3),
      ("amount", 10000),
      ("amount_o", 12000),
      ("total_amount", 10000),
      ("total_amount_o", 12000),
      ("tracer", 1),
      ("run", 2),
      ("BID", 1),
      ("batchnr", "Test"),
      ("COID", -1),
      ("frigivet_af", 1),
      ("frigivet_amount", 105348),
      ("frigivet_datetime", "2022-10-11 11:18:42"),
    ]


  def tearDown(self):
    cleanTable("oid", "orders", self._testMethodName)
    cleanTable("DTID", "deliverTimes", self._testMethodName)

  def test_GetElement_No_Element_to_get(self):
    self.assertIsNone(SQL.getElement(23089857, ActivityOrderDataClass))

  def test_GetElement_ActivtityOrderDataClass(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)
    AODC = SQL.getElement(13337, ActivityOrderDataClass)
    fieldMapping = {field.name : field for field in AODC.getFields()}

    for fieldName, value in self.activityOrderStatus3:
      field = fieldMapping[fieldName]
      if field.type == datetime:
        value = toDateTime(value)
      if get_origin(field.type) == Union:
        for Type in get_args(field.type):
          if Type == datetime:
            value = toDateTime(value)
      self.assertEqual(value, AODC.__getattribute__(fieldName))

    # Cleanup
    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 13337""", Exec.Fetching.NONE)

  def test_GetElementConditional_FailsOnMultipleReturns(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus2, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)

    self.assertRaises(InternalError, self.SQL.getConditionalElement, "TRUE", ActivityOrderDataClass)

    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 1337""", Exec.Fetching.NONE)
    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 13337""", Exec.Fetching.NONE)

  def test_GetElementConditional_ConditionalNotMeet(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus2, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)

    self.assertIsNone(self.SQL.getConditionalElement("oid = 23409857", ActivityOrderDataClass))

    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 1337""", Exec.Fetching.NONE)
    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 13337""", Exec.Fetching.NONE)


  def test_GetElementConditional_ConditionalMeet(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus2, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)

    AODC = self.SQL.getConditionalElement("oid = 1337", ActivityOrderDataClass)

    fieldMapping = {field.name : field for field in AODC.getFields()}

    for fieldName, value in self.activityOrderStatus2:
      field = fieldMapping[fieldName]
      if field.type == datetime:
        value = toDateTime(value)
      if get_origin(field.type) == Union:
        for Type in get_args(field.type):
          if Type == datetime:
            value = toDateTime(value)
      self.assertEqual(value, AODC.__getattribute__(fieldName))


    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 1337""", Exec.Fetching.NONE)
    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 13337""", Exec.Fetching.NONE)



  @useDataClass(DeliverTimeDataClass)
  def test_getDataClass_DeliverDateTime(self):
    DTs = SQL.getDataClass(DeliverTimeDataClass)

  @useDataClass(ActivityOrderDataClass)
  def test_deleteIDs_ActivityOrder(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus2, ActivityOrderDataClass.getSQLTable()), Exec.Fetching.NONE)

    self.SQL.deleteIDs([1337,13337], ActivityOrderDataClass)
    self.assertListEqual(testOrders, SQL.getDataClass(ActivityOrderDataClass))

    # No cleanup required!




""" This is an End to End of the SQL modules. The controller handles:
  * SQLExecuter
  * SQLFactory
  * SQLFormatter
"""
__author__ = "Christoffer Vilstrup Jensen"

from datetime import datetime
from pprint import pprint
from unittest import skip
from django.test import TestCase

from asgiref.sync import sync_to_async

from lib.SQL.SQLController import SQL
from lib.SQL import SQLExecuter as Exec
from lib.SQL import SQLFactory as Fact
from lib.ProductionDataClasses import ActivityOrderDataClass, DeliverTimeDataClass
from tests.test_DataClasses import useDataClass
from tests.helpers import cleanTable


class SQLControllerTestCase(TestCase):
  SQL = SQL()
  activityOrderStatus2Str = Fact.tupleInsertQuery(
    [ ("deliver_datetime","2022-10-11 11:30:00"),
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
    ], "orders"
  )
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

  def test_GetElement_ActivtityOrderDataClass(self):
    Exec.ExecuteQuery(Fact.tupleInsertQuery(self.activityOrderStatus3, "orders"), Exec.Fetching.NONE)
    AODC = SQL.getElement(13337, ActivityOrderDataClass)
    #print(AODC)
    #
    #fieldMapping = {field.name : field for field in AODC.getFields()}
    #pprint(fieldMapping)

    #for fieldName, value in self.activityOrderStatus3:
    #  field = fieldMapping[fieldName]
    #  if field.type == datetime:
    #    continue
    #  self.assertEqual(value, AODC.__getattribute__(fieldName))


    # Cleanup
    Exec.ExecuteQuery("""DELETE FROM orders WHERE oid = 13337""", Exec.Fetching.NONE)

  @useDataClass(DeliverTimeDataClass)
  def test_getDataClass_DeliverDateTime(self):
    DTs = SQL.getDataClass(DeliverTimeDataClass)


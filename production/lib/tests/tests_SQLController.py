""" This is an End to End of the SQL modules. The controller handles:
  * SQLExecuter
  * SQLFactory
  * SQLFormatter
"""
__author__ = "Christoffer Vilstrup Jensen"

from django.test import TestCase

from lib.SQL.SQLController import SQL
from lib.SQL import SQLExecuter as Exec
from lib.SQL import SQLFactory as Fact
from production.lib.ProductionDataClasses import ActivityOrderDataClass

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
  activityOrderStatus3Str = Fact.tupleInsertQuery(
    [ ("deliver_datetime","2022-10-11 11:30:00"),
      ("oid", 13337),
      ("status", 3),
      ("amount", 10000),
      ("amount_o", 12000),
      ("total_amount", 10000),
      ("total_amount_o", 12000),
      ("tracer", 1),
      ("run", 2),
      ("BID", 1),
      ("batchnr", ""),
      ("COID", -1),
      ("frigivet_af", 1),
      ("frigviet_amount", 105348)
    ], "orders"
  )

  def test_GetElement_ActivtityOrderDataClass(self):
    Exec.ExecuteQuery(self.activityOrderStatus3Str, Exec.Fetching.NONE)
    SQL.getElement(13337, ActivityOrderDataClass)


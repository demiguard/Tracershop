""" This test modules displays how the queries are generated for the legacy database
"""
__author__ = "Christoffer Vilstrup Jensen"

from dataclasses import dataclass
from django.test import TestCase

from lib import ProductionDataClasses as PDC
from lib.SQL import SQLFactory

from datetime import date, datetime, time
from lib.utils import LMAP

from tests.test_DataClasses import *


class SQLFactoryTestCase(TestCase):
  def setUp(self):
    self.test_Run = PDC.RunsDataClass(1, time(11,30,15), 1, 31)
    self.test_Tracer = PDC.TracerDataClass(6, "FDG", 6, -1, -1, True, 1, "I forgot this name")
    self.start_datetime = datetime(2020,10,10,10,10,10)
    self.end_datetime = datetime(2020,11,11,11,11,11)
    self.start_date = date(2020,10,10)
    self.end_date = date(2020,11,11)

  def test_update_run_query(self):
    Query = SQLFactory.UpdateJsonDataClass(self.test_Run)

    self.assertEqual("""UPDATE productionTimes
    SET
      day=1,
ptime="11:30:15",
run=1
    WHERE
      PTID=31""", Query)

  def test_update_tracer(self):
    Query = SQLFactory.UpdateJsonDataClass(self.test_Tracer)
    self.assertEqual("""UPDATE Tracers
    SET
      name="FDG",
isotope=6,
n_injections=-1,
order_block=-1,
in_use=1,
tracer_type=1,
longName="I forgot this name"
    WHERE
      id=6""", Query)

  def test_update__no_ID(self):
    testIsotopeDict = testIsotope_1.to_dict()
    del testIsotopeDict['ID']
    missingIDIsotope = PDC.IsotopeDataClass(**testIsotopeDict)
    self.assertRaises(AttributeError, SQLFactory.UpdateJsonDataClass, missingIDIsotope)

  def test_getElement_run(self):
    Query = SQLFactory.getElement(5, PDC.RunsDataClass)
    self.assertEqual("""SELECT
      day,
      TIME_FORMAT(ptime, "%T"),
      run,
      PTID
    FROM
      productionTimes
    Where
      PTID=5""", Query)

  def test_getDataClass_run(self):
    Query = SQLFactory.getDataClass(PDC.RunsDataClass)
    self.assertEqual("""SELECT
      day,
      TIME_FORMAT(ptime, "%T"),
      run,
      PTID
    FROM
      productionTimes
    WHERE
      TRUE""", Query)

  def test_getDataClassRange_vial(self):
    Query = SQLFactory.getDataClassRange(self.start_date, self.end_date, PDC.VialDataClass)
    self.assertEqual("""SELECT
      customer,
      charge,
      filldate,
      TIME_FORMAT(filltime, "%T"),
      volume,
      activity,
      ID,
      order_id
    FROM
      VAL
    WHERE
      filldate BETWEEN \"2020-10-10\" AND \"2020-11-11\"""", Query)

  def test_getDataClassRange_injection_order(self):
    Query = SQLFactory.getDataClassRange(self.start_datetime, self.end_datetime, PDC.InjectionOrderDataClass)
    self.assertEqual("""SELECT
      deliver_datetime, oid, status, n_injections, anvendelse, comment, username, tracer, BID, batchnr, frigivet_af, frigivet_datetime
    FROM
      t_orders
    WHERE
      deliver_datetime BETWEEN \"2020-10-10 10:10:10\" AND \"2020-11-11 11:11:11\"""", Query)

  def test_getDataClassRange_activity_order(self):
    Query = SQLFactory.getDataClassRange(self.start_datetime, self.end_datetime, PDC.ActivityOrderDataClass)
    self.assertEqual("""SELECT
      deliver_datetime, oid, status, amount, amount_o, total_amount, total_amount_o, tracer, run, BID, batchnr, COID, frigivet_af, frigivet_amount, volume, frigivet_datetime, comment, username
    FROM
      orders
    WHERE
      deliver_datetime BETWEEN \"2020-10-10 10:10:10\" AND \"2020-11-11 11:11:11\"""", Query)

  def test_insertQuery(self):
    """Note the query generated is not valid in a database"""
    Query = SQLFactory.tupleInsertQuery([
      ("col1", "val1"),
      ("col2", "val2"),
      ("col3", 123)
    ],"TestTable")
    self.assertEqual(Query, "INSERT INTO TestTable (col1, col2, col3) VALUES (\"val1\", \"val2\", 123)")

  def test_AuthenticateUser(self):
    """This test agaisnt the old database authentication system
     A system where it have unencrypted passwords!
    """
    test_username = "Test"
    test_password = "TestPassword"

    Query = SQLFactory.authenticateUser(test_username, test_password)

    self.assertEqual(Query, f"""SELECT
      Username,
      Id
    FROM
      Users
    WHERE
      Username=\"{test_username}\" AND
      Password=\"{test_password}\"""")

  def test_GetConditionalElement(self):
    """ I think this is get just a GetElemenet but fancy?
    """

    testTable = "TestTable"
    condition = "attr = \"Hello world\""

    @dataclass(init=False)
    class TestDataClass(JsonSerilizableDataClass):
      attr1 : str
      attr2 : int

      @classmethod
      def getSQLTable(cls):
        return testTable

    Query = SQLFactory.GetConditionalElement(condition, TestDataClass)

    self.assertEqual(Query, f"""SELECT
      attr1, attr2
    FROM
      {testTable}
    WHERE
      {condition}""")

  def test_deleteIDs(self):
    testTable = "TestTable"

    @dataclass(init=False)
    class TestDataClass(JsonSerilizableDataClass):
      attr1 : str
      attr2 : int

      @classmethod
      def getSQLTable(cls):
        return testTable

      @classmethod
      def getIDField(cls):
        return "attr2"

    ids = [1,2,3,4,5]

    Query = SQLFactory.deleteIDs(ids, TestDataClass)
    self.assertEqual(Query, f"""DELETE FROM {testTable}
    WHERE attr2 IN ({", ".join(LMAP(str,ids))})""")
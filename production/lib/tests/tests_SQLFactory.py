""" This test modules displays how the queries are generated for the legacy database
"""
__author__ = "Christoffer Vilstrup Jensen"

from django.test import TestCase

from lib import ProductionDataClasses as PDC
from lib.SQL import SQLFactory 

from datetime import date, datetime, time


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

    self.assertEqual("""
    UPDATE productionTimes
    SET
      day=1,
ptime="11:30:15",
run=1
    WHERE
      PTID=31\n  """, Query)

  def test_update_tracer(self):
    Query = SQLFactory.UpdateJsonDataClass(self.test_Tracer)
    self.assertEqual("""
    UPDATE Tracers
    SET
      name="FDG",
isotope=6,
n_injections=-1,
order_block=-1,
in_use=1,
tracer_type=1,
longName="I forgot this name"
    WHERE
      id=6\n  """, Query)

  def test_getElement_run(self):
    Query = SQLFactory.getElement(5, PDC.RunsDataClass)
    self.assertEqual("""
    SELECT
      day,
      TIME_FORMAT(ptime, "%T"),
      run,
      PTID
    FROM
      productionTimes
    Where
      PTID=5\n  """, Query)

  def test_getDataClass_run(self):
    Query = SQLFactory.getDataClass(PDC.RunsDataClass)
    self.assertEqual("""
    SELECT
      day,
      TIME_FORMAT(ptime, "%T"),
      run,
      PTID
    FROM
      productionTimes
    WHERE
      TRUE\n  """, Query)

  def test_getDataClassRange_vial(self):
    Query = SQLFactory.getDataClassRange(self.start_date, self.end_date, PDC.VialDataClass)
    self.assertEqual("""
    SELECT
      VAL.customer,
      VAL.charge,
      VAL.filldate,
      TIME_FORMAT(VAL.filltime, "%T"),
      VAL.volume,
      VAL.activity,
      VAL.ID,
      VialMapping.Order_id
    FROM
      VAL LEFT JOIN VialMapping on VAL.ID=VialMapping.VAL_id
    WHERE
      VAL.filldate BETWEEN \"2020-10-10\" AND \"2020-11-11\"\n  """, Query)

  def test_getDataClassRange_injection_order(self):
    Query = SQLFactory.getDataClassRange(self.start_datetime, self.end_datetime, PDC.InjectionOrderDataClass)
    self.assertEqual("""
    SELECT
      deliver_datetime, oid, status, n_injections, anvendelse, comment, username, tracer
    FROM
      t_orders
    WHERE
      deliver_datetime BETWEEN "2020-10-10 10:10:10" AND "2020-11-11 11:11:11"\n  """, Query)

  def test_getDataClassRange_activity_order(self):
    Query = SQLFactory.getDataClassRange(self.start_datetime, self.end_datetime, PDC.ActivityOrderDataClass)
    self.assertEqual("""
    SELECT
      deliver_datetime, oid, status, amount, amount_o, total_amount, total_amount_o, tracer, run, BID, batchnr, COID, frigivet_af, frigivet_amount, volume, frigivet_datetime, comment, username
    FROM
      orders
    WHERE
      deliver_datetime BETWEEN \"2020-10-10 10:10:10\" AND \"2020-11-11 11:11:11\"\n  """, Query)

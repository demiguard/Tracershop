from dataclasses import dataclass

from django.test import TestCase

from lib.ProductionDataClasses import *
from typing import Union, Optional
from time import perf_counter
from decimal import Decimal
import datetime

@dataclass
class DummyJsonSerilizableDataClass(JsonSerilizableDataClass):
  c: Optional[int] # This is to show that keys are NOT sorted
  a: int
  b: int

class DummyJsonSerilizableDataClassTestCase(TestCase):
  def setUp(self):
    self.testClass = DummyJsonSerilizableDataClass(a=3, b=4, c=5)
    self.testDict  = {
      "c" : 5, #This is to show that keys are NOT sorted
      "a" : 3,
      "b" : 4,
    }

  def test_setup_class(self):
    self.assertEqual(self.testClass.a, 3)
    self.assertEqual(self.testClass.b, 4)
    self.assertEqual(self.testClass.c, 5)

  def test_toDict(self):
    classDict = self.testClass.toDict()
    for key, value in classDict.items():
      self.assertIn(key, self.testDict)
      self.assertEqual(self.testDict[key], value)

  def test_fromDict(self):
    newClass = DummyJsonSerilizableDataClass.fromDict(self.testDict)
    self.assertEqual(self.testClass.a, newClass.a)
    self.assertEqual(self.testClass.b, newClass.b)
    self.assertEqual(self.testClass.c, newClass.c)

  def test_fromDictEqualivalent(self):
    """This test just shows that you can do both ways and really it's just
    Syntatic sugar
    """
    
    newClassStar = DummyJsonSerilizableDataClass(**self.testDict)
    newClass = DummyJsonSerilizableDataClass.fromDict(self.testDict)

    self.assertEqual(newClassStar.a, newClass.a)
    self.assertEqual(newClassStar.b, newClass.b)
    self.assertEqual(newClassStar.c, newClass.c)


  def test_getFields(self):
    """
      Shows that the order of fields is as the class is constructed
      and they are not sorted by fieldname.
    """
    fields = [field.name for field in DummyJsonSerilizableDataClass.getFields()]
    for field in fields:
      self.assertIn(field, ["a", "b", "c"])
    self.assertListEqual(fields, ["c", "a", "b"])
  
  def test_tupleCreation(self):
    """
      Simple test cases that shows how to construct a class from a tuple
    """
    dummyTuple = (5,3,4)
    testInstance = DummyJsonSerilizableDataClass(*dummyTuple)
    self.assertEqual(self.testClass.a, 3)
    self.assertEqual(self.testClass.b, 4)
    self.assertEqual(self.testClass.c, 5)

  def test_NoneCreateClass(self):
    testInstance = DummyJsonSerilizableDataClass(None, 3, 4)
    self.assertEqual(testInstance.a, 3)
    self.assertEqual(testInstance.b, 4)
    self.assertEqual(testInstance.c, None)

  def test_ActivityOrderTestSpeed(self):
    exampleDict = {
      'deliver_datetime': '2021-12-10T08:15:00', 
      'oid': 41509, 
      'status': 2, 
      'amount': 10000, 
      'amount_o': 12000, 
      'total_amount': 10000, 
      'total_amount_o': 12000, 
      'run': 1, 
      'BID': 7, 
      'batchnr': '', 
      'COID': -1
    }
    start = perf_counter()
    ActivityOrderDataClass(**exampleDict)
    end   = perf_counter()
  
    print(f"Created class in {end - start}")

  def test_VialWithMinimalData(self):
    data = {
      'charge': 'test',
      'filltime': '10:00:00',
      'filldate': '2021-12-10',
      'customer': 1,
      'activity': 1000,
      'volume': 10
    }
    Vial = VialDataClass(**data)

    self.assertEqual(Vial.customer, 1 )
    self.assertEqual(Vial.charge, "test")
    self.assertEqual(Vial.filldate, datetime.date(2021, 12, 10))
    self.assertEqual(Vial.filltime, datetime.time(10,0))
    self.assertEqual(Vial.volume, 10)
    self.assertEqual(Vial.activity, 1000)
    self.assertIsNone(Vial.ID)
    self.assertIsNone(Vial.OrderMap)

  def test_TupleConstrution(self):
    testTuple = ('1', 'test', datetime.date(2021, 12, 10), '10:00:00', Decimal('10.00'), Decimal('10000.00'), 36066, None)
    Vial = VialDataClass(*testTuple)

    self.assertEqual(Vial.customer, 1 )
    self.assertEqual(Vial.charge, "test")
    self.assertEqual(Vial.filldate, datetime.date(2021, 12, 10))
    self.assertEqual(Vial.filltime, datetime.time(10,0))
    self.assertEqual(Vial.volume, 10)
    self.assertEqual(Vial.activity, 10000)
    self.assertEqual(Vial.ID, 36066)
    self.assertIsNone(Vial.OrderMap)

  def test_ActivityOrderSQLFields(self):
    Expected = "deliver_datetime, oid, status, amount, amount_o, total_amount, total_amount_o, run, BID, batchnr, COID"
    self.assertEqual(ActivityOrderDataClass.getSQLFields(), Expected)
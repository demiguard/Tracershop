""" This test file serves as a play ground for a lot of the tricks employed in the project

It attempts to show some parculiarities found in python and this module. Note that alot of the program is trying to do alot with with a few lines of code

In other words the whole idea behind dataclasses is to write some extremly powerful code in very "few" lines of code

The upside to this is a very small code base once you understand what's going on, the downside is that 

"""

__author__ = "Christoffer Vilstrup Jensen"

from dataclasses import dataclass, fields

from django.test import TestCase

from lib.ProductionDataClasses import *
from typing import Union, Optional
from time import perf_counter
from decimal import Decimal
import datetime

@dataclass(init=False)
class DummyJsonSerilizableDataClass(JsonSerilizableDataClass):
  c: Optional[int] # This is to show that keys are NOT sorted
  a: int
  b: int

@dataclass(init=False)
class DummyJsonSerilizableDataClassOrdered(JsonSerilizableDataClass):
  a:int
  b:int
  c:Optional[int]

class DummyJsonSerilizableDataClassTestCase(TestCase):
  def setUp(self):
    self.testClass = DummyJsonSerilizableDataClass(a=3, b=4, c=5)
    self.testDict  = {
      "a" : 3,
      "c" : 5, #This is to show that keys are NOT sorted
      "b" : 4,
    }

    self.testClassNoOp = DummyJsonSerilizableDataClass(None, 2, 3)
    self.testDictNoOp  = {
      "a" : 2,
      "b" : 3,
    }
    self.testOrderClass = DummyJsonSerilizableDataClassOrdered(2,3)

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

  """
    The following test displayes just where you put put optional keyword at the end of the dataclass
    else you'll run into these problems IE notice the difference creation methods

    Note it's very important to overwrite the init dataclass method, since it's not type safe
  """
  def test_positional_optional_class_creation(self):
    self.assertEqual(self.testClassNoOp.a, 2)
    self.assertEqual(self.testClassNoOp.b, 3)

  def test_positional_optional_class_creation_args(self):
    clsInstance = DummyJsonSerilizableDataClass(2,3)
    self.assertEqual(clsInstance.c, 2)
    self.assertEqual(clsInstance.a, 3)
    self.assertRaises(AttributeError, getattr, clsInstance, "b")


  def test_positional_optional_class_creation_tuple(self):
    clsInstance = DummyJsonSerilizableDataClass(*(2,3))
    self.assertEqual(clsInstance.c, 2)
    self.assertEqual(clsInstance.a, 3)
    self.assertRaises(AttributeError, getattr, clsInstance, "b")

  def test_positional_optional_class_creation_dict(self):
    clsInstance = DummyJsonSerilizableDataClass(**self.testDictNoOp)
    clsInstance_2 = DummyJsonSerilizableDataClass.fromDict(self.testDictNoOp)

    self.assertEqual(clsInstance.a, 2)
    self.assertEqual(clsInstance.b, 3)

    self.assertEqual(clsInstance_2.a, 2)
    self.assertEqual(clsInstance_2.b, 3)

  def test_fixed_optional_position_args(self):
    clsInstance = DummyJsonSerilizableDataClassOrdered(2,3)
    self.assertEqual(clsInstance.a, 2)
    self.assertEqual(clsInstance.b, 3)

  def test_dataclass_optional_positionMattersTuple(self):
    Tuple = (2,3)
    clsInstance = DummyJsonSerilizableDataClassOrdered(*Tuple)
    self.assertEqual(clsInstance.a, 2)
    self.assertEqual(clsInstance.b, 3)

  # under the hood it's the same creation method, only difference is call sturcture
  def test_dataclass_optional_positionMattersDict(self):
    clsInstance = DummyJsonSerilizableDataClassOrdered(**self.testDictNoOp)
    clsInstance_2 = DummyJsonSerilizableDataClassOrdered.fromDict(self.testDictNoOp)

    self.assertEqual(clsInstance.a, 2)
    self.assertEqual(clsInstance.b, 3)

    self.assertEqual(clsInstance_2.a, 2)
    self.assertEqual(clsInstance_2.b, 3)

  # Positional test End.

  def test_getattr(self):
    self.assertEqual(getattr(self.testClass, "a"), self.testClass.a)
    self.assertEqual(getattr(self.testClass, "b"), self.testClass.b)
    self.assertEqual(getattr(self.testClass, "c"), self.testClass.c)

  def test_getattrNoOp(self):
    self.assertEqual(getattr(self.testClassNoOp, "a"), self.testClassNoOp.a)
    self.assertEqual(getattr(self.testClassNoOp, "b"), self.testClassNoOp.b)
    self.assertEqual(getattr(self.testClassNoOp, "c"), self.testClassNoOp.c)

  def test_hasAttrOptional(self):
    self.assertTrue(hasattr(self.testOrderClass, "a"))
    self.assertTrue(hasattr(self.testOrderClass, "b"))
    self.assertTrue(hasattr(self.testOrderClass, "c"))

    self.assertEqual(None, self.testOrderClass.c)
    self.assertEqual(None, getattr(self.testOrderClass, "c"))

  def test_FieldIteration(self):
    # Note this test proves even if an arg is missing the field is still iterated over, meaning you might need some extra code
    count = 0
    for field in self.testOrderClass.getFields():
      count += 1
    self.assertEqual(count, 3)

  def test_getFields(self):
    """
      Shows that the order of fields is as the class is constructed
      and they are not sorted by fieldname.
    """
    fields = [field.name for field in DummyJsonSerilizableDataClass.getFields()]
    for field in fields:
      self.assertIn(field, ["a", "b", "c"])
    self.assertListEqual(fields, ["c", "a", "b"])

  def test_invalid_types(self):
    self.assertRaises(TypeError, DummyJsonSerilizableDataClass, "c", "a", "b")
    self.assertRaises(TypeError, DummyJsonSerilizableDataClass, 1, "a", "b")
    self.assertRaises(TypeError, DummyJsonSerilizableDataClass, 1, 2, "b")

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

  def test_VialWithMinimalData(self):
    data = {
      'charge': 'test',
      'filltime': '10:00:00',
      'filldate': '2021-12-10',
      'customer': 1,
      'activity': 1000,
      'volume': 10,
      'ID' : 53120
    }
    Vial = VialDataClass(**data)

    self.assertEqual(Vial.customer, 1 )
    self.assertEqual(Vial.charge, "test")
    self.assertEqual(Vial.filldate, datetime.date(2021, 12, 10))
    self.assertEqual(Vial.filltime, datetime.time(10,0))
    self.assertEqual(Vial.volume, 10)
    self.assertEqual(Vial.activity, 1000)
    self.assertEqual(Vial.ID, 53120)
    self.assertIsNone(Vial.order_id)

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
    self.assertIsNone(Vial.order_id)

  def test_ActivityOrderSQLFields(self):
    Expected = "deliver_datetime, oid, status, amount, amount_o, total_amount, total_amount_o, tracer, run, BID, batchnr, COID, frigivet_af, frigivet_amount, volume, frigivet_datetime, comment, username"
    self.assertEqual(ActivityOrderDataClass.getSQLFields(), Expected)

from dataclasses import dataclass

from django.test import TestCase

from lib.ProductionDataClasses import *
from typing import Union, Optional


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

  def test_getFields(self):
    """
      Shows that the order of fields is as the class is constructed
      and they are not sorted by fieldname.
    """
    fields = DummyJsonSerilizableDataClass.getFields()
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

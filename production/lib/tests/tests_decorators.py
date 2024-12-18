from django.test import TestCase

from typing import Union, Optional, List, Any

from lib.decorators import typeCheckFunc

class TypeCheckingTest(TestCase):
  def test_dummy_function(self):
    self.assertEqual(7, testFunction(3,4))

  def test_dummy_function_type_error(self):
    try:
      testFunction("hello", 4) # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "Argument x is of type: <class 'str'>, but this doesn't match the annotations\n")

  def test_noannotations(self):
    self.assertEqual(7, testFunctionNoAnnotations(3, 4))

  def test_noannotations_typeError(self):
    try:
      testFunctionNoAnnotations("hello", 4)
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "can only concatenate str (not \"int\") to str")

  def test_Partial_args_x(self):
    try:
      testFunctionPartial("hello", 4) # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "Argument x is of type: <class 'str'>, but this doesn't match the annotations\n")

  def test_Partial_args_y(self):
    try:
      testFunctionPartial(4,"hello")
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "unsupported operand type(s) for +: 'int' and 'str'")

  def test_ManyArgs(self):
    self.assertEqual(testFunctionManyArgs(3, 4, "Hello world", "this arg is ignored", 31.1231), 7)

  def test_KW(self):
    self.assertEqual(testFunctionKWargAnnotation(3,4), 10)

  def test_KW_weird_call(self):
    try:
      # this is a standard python lib, but It still shows that it's that throws an exception and not my function
      testFunctionKWargAnnotation(3,4,3, aKW=3) # type: ignore
    except TypeError as Err:
      self.assertEqual(str(Err), "testFunctionKWargAnnotation() got multiple values for argument 'aKW'")

  def test_KW_type_error(self):
    try:
      testFunctionKWargAnnotation(3, 4, aKW="str")  # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "Argument aKW is of type: <class 'str'>, but this doesn't match the annotations\n")

  # Regarding the Union of Union types, that kinda doesn't make any sense since it's a Union of a Union is just a bigger Union
  def test_UnionType_int(self):
    self.assertEqual(testFunctionUnionType(3), 3)

  def test_UnionType_str(self):
    self.assertEqual(testFunctionUnionType("hello world"), "hello world")

  def test_UnionType_float(self):
    try:
      testFunctionUnionType(3.14159265359) # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "Argument x is of type: <class 'float'>, but this doesn't match the annotations\n")

  def test_ListType(self):
    self.assertEqual([2,3,4,5], testFunctionList([1,2,3,4]))

  def test_ListType_incorrectType(self):
    try:
      testFunctionList(["zxcv","wers","helloworld","wqer"]) # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "An element of iterable l is not of type: <class 'int'>")

  def test_ListListType(self):
    self.assertEqual([[2,3,4],[5,6,7],[8,9,10]], testFunctionNestedList([[1,2,3],[4,5,6],[7,8,9]]))

  def test_ListListTypeFail(self):
    try:
      testFunctionNestedList([[1,2,3],[4,"asdf",6],[7,8,9]]) # type: ignore
      self.assertEqual(1, 2)
    except TypeError as Err:
      self.assertEqual(str(Err), "An element of iterable ll is not of type: typing.List[int]")


  #def test_anyType(self):
  #  self.assertEqual(testFunctionAny("123"), "123")

@typeCheckFunc
def testFunction(x:int , y:int):
  return x + y

@typeCheckFunc
def testFunctionNoAnnotations(x, y):
  return x + y

@typeCheckFunc
def testFunctionPartial(x: int, y):
  return x + y

@typeCheckFunc
def testFunctionKWargAnnotation(x: int, y: int, aKW : int=3):
  return x + y + aKW

@typeCheckFunc
def testFunctionUnionType(x: Union[int, str]):
  return x

@typeCheckFunc
def testFunctionAny(x:Any):
  return x

@typeCheckFunc
def testFunctionList(l : List[int]):
  return list(map(lambda x: x+1,l))

@typeCheckFunc
def testFunctionManyArgs(x:int, y:int, *args):
  return x + y

@typeCheckFunc
def testFunctionNestedList(ll : List[List[int]]):
  #Okay It's clear from this syntax that python is not the world best functional language
  return [[x + 1 for x in l] for l in ll]

class TestFunctionalClass:
  def testFunction(self, x: int, y: int):
    return x + y

  @staticmethod
  def testFunctionStatic(x: int, y: int):
    return x + y

"""Module for independant utility functions

Note: this modules should not depend on any tracershop libraries
to prevent circular imports
"""


from typing import Any,Callable, List, Generic,TypeVar

T = TypeVar('T')
T2 = TypeVar('T2')

__author__ = "Christoffer Vilstrup Jensen"

def LMAP(func: Callable[[T], T2], list_:List[T]):
  return list(map(func, list_))

def LFILTER(func: Callable[[T], bool], List: List[T]):
  return list(filter(func, List))

class classproperty(property):
  def __get__(self, owner_self, owner_cls=None):
    if owner_cls is None or self is None:
      raise ValueError("You have class error without class???")
    if self.fget is None:
      raise ValueError("Somehow fget is None?")
    return self.fget(owner_cls)

def identity(val: T) -> T:
  """The identity function

  Args:
      val (T): An input

  Returns:
      T: The same input
  """
  return val

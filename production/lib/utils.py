"""Module for independant utility functions

Note: this modules should not depend on any tracershop libraries
to prevent circular imports
"""


from typing import Any,Callable, List, Generic, Optional,TypeVar

T = TypeVar('T')
T2 = TypeVar('T2')

__author__ = "Christoffer Vilstrup Jensen"

def LMAP(func: Callable[[T], T2], list_:List[T]):
  return list(map(func, list_))

def LFILTER(func: Callable[[T], bool], List: List[T]):
  return list(filter(func, List))

class classproperty[cT](property):
  def __get__(self, owner_self, owner_cls=None) -> cT: #type: ignore
    if owner_cls is None or self is None:
      raise ValueError("You have class error without class???") # pragma: no cover
    if self.fget is None:
      raise ValueError("Somehow fget is None?") # pragma: no cover
    return self.fget(owner_cls) #type: ignore

def identity(val: T) -> T:
  """The identity function

  Args:
      val (T): An input

  Returns:
      T: The same input
  """
  return val


def default[dT](value: Optional[dT], default_value: dT):
  """A less verbose way of writing:
  >>> value if value is not None else default_value
  """
  return value if value is not None else default_value

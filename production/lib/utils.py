"""Module for independant utility functions

Note: this modules should not depend on any tracershop libraries
to prevent circular imports
"""

__author__ = "Christoffer Vilstrup Jensen"

def LMAP(func, List):
  return list(map(func, List))

def LFILTER(func, List):
  return list(filter(func, List))

def iterable(object : object) -> bool:
  return hasattr(object, "__iter__") and hasattr(object, "__next__")

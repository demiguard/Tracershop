"""Module for independant utility functions

Note: this modules should not depend on any tracershop libraries
to prevent circular imports
"""

__author__ = "Christoffer Vilstrup Jensen"

def LMAP(func, List):
  return list(map(func, List))

def LFILTER(func, List):
  return list(filter(func, List))


class classproperty(property):
  def __get__(self, owner_self, owner_cls):
    return self.fget(owner_cls) # type: ignore
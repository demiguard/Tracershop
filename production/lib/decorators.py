import functools
import inspect
from inspect import signature, Signature
from typing import Union, List, Tuple, Any, Optional, get_origin, get_args

def typeCheckFunc(func):
  @functools.wraps(func)
  def wrapper(*args, **kwargs):
    sig = inspect.signature(func)
    errorMessage = ""
    for arg, (key, parameter)  in zip(args, sig.parameters.items()):
      if get_origin(parameter.annotation) is Union:
        if isinstance(arg, parameter.annotation.__args__):
          pass
        else:
          errorMessage += f"Argument {key} is of type: {type(arg)}, but this doesn't match the annotations\n"
      elif isinstance(arg, List):
        if typeCheckIterable(parameter.annotation.__args__, arg):
          pass
        else:
          errorMessage += f"An element of iterable {key} is not of type: {parameter.annotation.__args__[0]}"
      else:
        if issubclass(Signature.empty, parameter.annotation) or isinstance(arg, parameter.annotation):
          pass
        else:
          errorMessage += f"Argument {key} is of type: {type(arg)}, but this doesn't match the annotations\n"
    for (key, value) in kwargs.items():
      parameter = sig.parameters[key]
      if get_origin(parameter.annotation) is Union:
        if isinstance(value, parameter.annotation.__args__):
          pass
        else:
          errorMessage += f"Argument {key} is of type: {type(value)}, but this doesn't match the annotations\n"
      elif isinstance(value, List):
        if typeCheckIterable(parameter.annotation.__args__, value):
          pass
        else:
          errorMessage += f"An element of iterable {key} is not of type: {parameter.annotation.__args__[0]}"
      else:
        if issubclass(Signature.empty, parameter.annotation) or isinstance(value, parameter.annotation):
          pass
        else:
          errorMessage += f"Argument {key} is of type: {type(value)}, but this doesn't match the annotations\n"
    if errorMessage:
        raise TypeError(errorMessage)

    value = func(*args, **kwargs)
    return value
  return wrapper

def typeCheckIterable(dataType, l):
  dataType = dataType[0] # Okay I'll support regular typed arrays
  #IE NO List[Type1, Type2]
  if get_origin(dataType) is list:
    for ll in l:
      if not typeCheckIterable(dataType.__args__, ll):
        return False
    return True

  for elem in l:
    if not isinstance(elem, dataType):
      return False

  return True

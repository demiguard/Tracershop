"""This module concerns itself with creating messages"""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard Library
from random import randint


def getNewMessageID() -> int:
  """Gets a random message ID

  Note that javascript only natively support 32 bit integers,
  and floating point arithmetic starts fucking up at 64 bit.
  So I just limited it to 32 bit.

  Returns:
      int : A random number from [0, 2147483648]
  """
  return randint(0, 1 << 32 - 1)

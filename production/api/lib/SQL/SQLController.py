from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from typing import Type
from datetime import datetime, time, date

from api.lib.SQL import SQLFormatter, SQLExecuter, SQLFactory, SQLLegacyController


def getCustomers():
  """
    This is a function to get the endpoints for the system such as petrh / life

    The end result should be on the form
    [
      {
        ID : <int>
        username : <string
      }, ...
    ]
  """
  return SQLLegacyController.getCustomers()

def getCustomer(ID):
  return SQLLegacyController.getCustomer(ID)

def getCustomerDeliverTimes(ID):
  return SQLLegacyController.getCustomerDeliverTimes(ID)
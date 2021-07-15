from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from typing import Type
from datetime import datetime, time, date

from api.lib.SQL import SQLFormatter, SQLExecuter, SQLFactory, SQLLegacyController

"""
This class contains all the database calls to the database.
Note that a large part of this is just calls to the Legacy controller. 
This is because one should be able to exchange that, module if the underlying database changes.

"""


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

def getTracers():
  return SQLLegacyController.getTracers()

def getIsotopes():
  return SQLLegacyController.getIsotopes()

def getCustomer(ID):
  return SQLLegacyController.getCustomer(ID)

def getCustomerDeliverTimes(ID):
  return SQLLegacyController.getCustomerDeliverTimes(ID)

def getTorderMonthlyStatus(year : int, month : int):
  return SQLLegacyController.getTorderMonthlyStatus(year-2, month)

def getOrderMonthlyStatus(year : int, month : int):
  return SQLLegacyController.getOrderMonthlyStatus(year-2, month)
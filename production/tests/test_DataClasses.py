"""Module for Creating dataclasses to reduce the amount of boiler plate code
in test cases.

Notable Functions:
 * useDataClass - Decorator, that creates and destroys dataclasses around testcase
 * useDataClassAsync - Async version of useDataClass
"""

# Python3 standard library
from asgiref.sync import sync_to_async
from datetime import date, datetime, time, timedelta
from typing import Dict,List, Type

# Third party packages

#

import functools

from mysql.connector.errors import IntegrityError
from constants import *
from dataclass.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, InjectionOrderDataClass, IsotopeDataClass, JsonSerilizableDataClass, RunsDataClass, TracerDataClass, VialDataClass
from database.production_database.SQLExecuter import ExecuteQuery, Fetching
from tests.helpers import async_ExecuteQuery

today = datetime.now()


# Async Functions


##### Customer Dataclasses #####
testCustomer_1 = CustomerDataClass.fromDict({
        LEGACY_KEYWORD_USERNAME : "test_username_1",
        LEGACY_KEYWORD_ID : 1,
        LEGACY_KEYWORD_OVERHEAD : 30,
        LEGACY_KEYWORD_CUSTOMER_NUMBER : 1,
        LEGACY_KEYWORD_REAL_NAME : "test_RealName_1",
        LEGACY_KEYWORD_EMAIL_1 : "test_email_1_1@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_2 : "test_email_2_1@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_3 : "test_email_3_1@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_4 : "test_email_4_1@doesntExists.com",
        LEGACY_KEYWORD_CONTACT : "test_contact_1",
        LEGACY_KEYWORD_TELEFON_NUMBER : 20000000,
        LEGACY_KEYWORD_ADDRESS_1 : "test_address_1_1",
        LEGACY_KEYWORD_ADDRESS_2 : "test_address_2_1",
        LEGACY_KEYWORD_ADDRESS_3 : "test_address_3_1",
        LEGACY_KEYWORD_ADDRESS_4 : "test_address_4_1",
})

testCustomer_2 = CustomerDataClass.fromDict({
        LEGACY_KEYWORD_USERNAME : "test_username_2",
        LEGACY_KEYWORD_ID : 2,
        LEGACY_KEYWORD_OVERHEAD : 25,
        LEGACY_KEYWORD_CUSTOMER_NUMBER : 2,
        LEGACY_KEYWORD_REAL_NAME : "test_RealName_2",
        LEGACY_KEYWORD_EMAIL_1 : "test_email_1_2@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_2 : "test_email_2_2@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_3 : "test_email_3_2@doesntExists.com",
        LEGACY_KEYWORD_EMAIL_4 : "test_email_4_2@doesntExists.com",
        LEGACY_KEYWORD_CONTACT : "test_contact_2",
        LEGACY_KEYWORD_TELEFON_NUMBER : 10000000,
        LEGACY_KEYWORD_ADDRESS_1 : "test_address_1_2",
        LEGACY_KEYWORD_ADDRESS_2 : "test_address_2_2",
        LEGACY_KEYWORD_ADDRESS_3 : "test_address_3_2",
        LEGACY_KEYWORD_ADDRESS_4 : "test_address_4_2",
})

testCustomers = [testCustomer_1, testCustomer_2]

##### Deliver datetime #####
test_deliver_datetime_1 = DeliverTimeDataClass.fromDict({
    LEGACY_KEYWORD_BID : 1,
    LEGACY_KEYWORD_DAY : 3,
    LEGACY_KEYWORD_REPEAT : 2,
    LEGACY_KEYWORD_DELIVER_TIME : time(8,10,11),
    LEGACY_KEYWORD_RUN : 1,
    LEGACY_KEYWORD_DELIVER_TIME_ID : 1
})

test_deliver_datetime_2 = DeliverTimeDataClass.fromDict({
    LEGACY_KEYWORD_BID : 1,
    LEGACY_KEYWORD_DAY : 3,
    LEGACY_KEYWORD_REPEAT : 2,
    LEGACY_KEYWORD_DELIVER_TIME : time(11,22,33),
    LEGACY_KEYWORD_RUN : 2,
    LEGACY_KEYWORD_DELIVER_TIME_ID : 2
})

test_deliver_datetime_3 = DeliverTimeDataClass.fromDict({
    LEGACY_KEYWORD_BID : 2,
    LEGACY_KEYWORD_DAY : 3,
    LEGACY_KEYWORD_REPEAT : 2,
    LEGACY_KEYWORD_DELIVER_TIME : time(8,10,11),
    LEGACY_KEYWORD_RUN : 1,
    LEGACY_KEYWORD_DELIVER_TIME_ID : 3
})

test_deliver_datetime_4 = DeliverTimeDataClass.fromDict({
    LEGACY_KEYWORD_BID : 2,
    LEGACY_KEYWORD_DAY : 3,
    LEGACY_KEYWORD_REPEAT : 2,
    LEGACY_KEYWORD_DELIVER_TIME : time(11,22,33),
    LEGACY_KEYWORD_RUN : 2,
    LEGACY_KEYWORD_DELIVER_TIME_ID : 4
})

testDeliverDateTime = [
    test_deliver_datetime_1,
    test_deliver_datetime_2,
    test_deliver_datetime_3,
    test_deliver_datetime_4
]

# Employee

# Isotopes

testIsotope_1 = IsotopeDataClass.fromDict({
  LEGACY_KEYWORD_ID : 1,
  LEGACY_KEYWORD_NAME : "test_isotope_1",
  LEGACY_KEYWORD_HALFLIFE : 1337.0
})

testIsotope_2 = IsotopeDataClass.fromDict({
  LEGACY_KEYWORD_ID : 2,
  LEGACY_KEYWORD_NAME : "test_isotope_2",
  LEGACY_KEYWORD_HALFLIFE : 420.0
})

testIsotope_3 = IsotopeDataClass.fromDict({
  LEGACY_KEYWORD_ID : 3,
  LEGACY_KEYWORD_NAME : "test_isotope_3",
  LEGACY_KEYWORD_HALFLIFE : 69.0
})

testIsotopes = [testIsotope_1, testIsotope_2, testIsotope_3]

# orders

testOrder_1 = ActivityOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  LEGACY_KEYWORD_OID : 1,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_AMOUNT : 10000.0,
  LEGACY_KEYWORD_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT : 10000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TRACER : 1,
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_BID : 1,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_COID : -1,
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_AMOUNT : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
  LEGACY_KEYWORD_VOLUME : None,
  LEGACY_KEYWORD_USERNAME_ORDERS : None,
  LEGACY_KEYWORD_COMMENT : None
})

testOrder_2 = ActivityOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  LEGACY_KEYWORD_OID : 2,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_AMOUNT : 10000.0,
  LEGACY_KEYWORD_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT : 10000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TRACER : 1,
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_BID : 1,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_COID : -1,
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_AMOUNT : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
  LEGACY_KEYWORD_VOLUME : None,
  LEGACY_KEYWORD_USERNAME_ORDERS : None,
  LEGACY_KEYWORD_COMMENT : None
})

testOrder_3 = ActivityOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  LEGACY_KEYWORD_OID : 3,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_AMOUNT : 10000.0,
  LEGACY_KEYWORD_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT : 10000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TRACER : 1,
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_BID : 1,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_COID : -1,
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_AMOUNT : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
  LEGACY_KEYWORD_VOLUME : None,
  LEGACY_KEYWORD_USERNAME_ORDERS : None,
  LEGACY_KEYWORD_COMMENT : None
})

testOrder_4 = ActivityOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0) - timedelta(days = 100),
  LEGACY_KEYWORD_OID : 4,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_AMOUNT : 10000.0,
  LEGACY_KEYWORD_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT : 10000.0,
  LEGACY_KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  LEGACY_KEYWORD_TRACER : 1,
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_BID : 1,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_COID : -1,
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_AMOUNT : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
  LEGACY_KEYWORD_VOLUME : None,
  LEGACY_KEYWORD_USERNAME_ORDERS : None,
  LEGACY_KEYWORD_COMMENT : None
})

testOrders = [testOrder_1, testOrder_2, testOrder_3, testOrder_4]

# runs

testRun_1 = RunsDataClass.fromDict({
  LEGACY_KEYWORD_DAY : 3,
  LEGACY_KEYWORD_PRODUCTION_TIME : time(6,30,0),
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_PRODUCTION_ID : 1
})

testRun_2 = RunsDataClass.fromDict({
  LEGACY_KEYWORD_DAY : 3,
  LEGACY_KEYWORD_PRODUCTION_TIME : time(11,30,0),
  LEGACY_KEYWORD_RUN : 2,
  LEGACY_KEYWORD_PRODUCTION_ID : 2
})

testRun_3 = RunsDataClass.fromDict({
  LEGACY_KEYWORD_DAY : 4,
  LEGACY_KEYWORD_PRODUCTION_TIME : time(6,30,0),
  LEGACY_KEYWORD_RUN : 1,
  LEGACY_KEYWORD_PRODUCTION_ID : 3
})

testRuns = [testRun_1, testRun_2, testRun_3]

# t_orders

testTOrder_1 = InjectionOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0),
  LEGACY_KEYWORD_OID : 1,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_INJECTIONS : 2,
  LEGACY_KEYWORD_USAGE : "Human",
  LEGACY_KEYWORD_COMMENT : "",
  LEGACY_KEYWORD_USERNAME_ORDERS : "",
  LEGACY_KEYWORD_TRACER : 2,
  LEGACY_KEYWORD_BID : 2,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
})

testTOrder_2 = InjectionOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0),
  LEGACY_KEYWORD_OID : 2,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_INJECTIONS : 2,
  LEGACY_KEYWORD_USAGE : "Human",
  LEGACY_KEYWORD_COMMENT : "",
  LEGACY_KEYWORD_USERNAME_ORDERS : "",
  LEGACY_KEYWORD_TRACER : 2,
  LEGACY_KEYWORD_BID : 2,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
})

testTOrder_3 = InjectionOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0) + timedelta(days=33),
  LEGACY_KEYWORD_OID : 3,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_INJECTIONS : 2,
  LEGACY_KEYWORD_USAGE : "Human",
  LEGACY_KEYWORD_COMMENT : "",
  LEGACY_KEYWORD_USERNAME_ORDERS : "",
  LEGACY_KEYWORD_TRACER : 2,
  LEGACY_KEYWORD_BID : 2,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
})

testTOrder_4 = InjectionOrderDataClass.fromDict({
  LEGACY_KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0) - timedelta(days=14),
  LEGACY_KEYWORD_OID : 4,
  LEGACY_KEYWORD_STATUS : 2,
  LEGACY_KEYWORD_INJECTIONS : 2,
  LEGACY_KEYWORD_USAGE : "Human",
  LEGACY_KEYWORD_COMMENT : "",
  LEGACY_KEYWORD_USERNAME_ORDERS : "",
  LEGACY_KEYWORD_TRACER : 2,
  LEGACY_KEYWORD_BID : 2,
  LEGACY_KEYWORD_BATCHNR : "",
  LEGACY_KEYWORD_FREED_BY : None,
  LEGACY_KEYWORD_FREED_DATETIME : None,
})

testTOrders = [testTOrder_1, testTOrder_2, testTOrder_3, testTOrder_4]
# Tracer
testTracer_1 = TracerDataClass.fromDict({
  LEGACY_KEYWORD_SMALL_ID : 1,
  LEGACY_KEYWORD_NAME : "test_name_1",
  LEGACY_KEYWORD_ISOTOPE : 1,
  LEGACY_KEYWORD_INJECTIONS : 60,
  LEGACY_KEYWORD_ORDER_BLOCK : 33,
  LEGACY_KEYWORD_IN_USE : True,
  LEGACY_KEYWORD_TRACER_TYPE : 1,
  LEGACY_KEYWORD_LONG_NAME : "test_long_name_1"
})

testTracer_2 = TracerDataClass.fromDict({
  LEGACY_KEYWORD_SMALL_ID : 2,
  LEGACY_KEYWORD_NAME : "test_name_2",
  LEGACY_KEYWORD_ISOTOPE : 1,
  LEGACY_KEYWORD_INJECTIONS : 60,
  LEGACY_KEYWORD_ORDER_BLOCK : 33,
  LEGACY_KEYWORD_IN_USE : False,
  LEGACY_KEYWORD_TRACER_TYPE : 1,
  LEGACY_KEYWORD_LONG_NAME : "test_long_name_2"
})

testTracer_3 = TracerDataClass.fromDict({
  LEGACY_KEYWORD_SMALL_ID : 3,
  LEGACY_KEYWORD_NAME : "test_name_3",
  LEGACY_KEYWORD_ISOTOPE : 2,
  LEGACY_KEYWORD_INJECTIONS : 60,
  LEGACY_KEYWORD_ORDER_BLOCK : 33,
  LEGACY_KEYWORD_IN_USE : True,
  LEGACY_KEYWORD_TRACER_TYPE : 1,
  LEGACY_KEYWORD_LONG_NAME : "test_long_name_3"
})
testTracer_4 = TracerDataClass.fromDict({
  LEGACY_KEYWORD_SMALL_ID : 4,
  LEGACY_KEYWORD_NAME : "test_name_4",
  LEGACY_KEYWORD_ISOTOPE : 3,
  LEGACY_KEYWORD_INJECTIONS : 60,
  LEGACY_KEYWORD_ORDER_BLOCK : 33,
  LEGACY_KEYWORD_IN_USE : True,
  LEGACY_KEYWORD_TRACER_TYPE : 1,
  LEGACY_KEYWORD_LONG_NAME : "test_long_name_4"
}),
testTracer_4 = TracerDataClass.fromDict({
  LEGACY_KEYWORD_SMALL_ID : 5,
  LEGACY_KEYWORD_NAME : "test_name_5",
  LEGACY_KEYWORD_ISOTOPE : 3,
  LEGACY_KEYWORD_INJECTIONS : 60,
  LEGACY_KEYWORD_ORDER_BLOCK : 33,
  LEGACY_KEYWORD_IN_USE : True,
  LEGACY_KEYWORD_TRACER_TYPE : 2,
  LEGACY_KEYWORD_LONG_NAME : "test_long_name_5"
})

testTracers = [testTracer_1, testTracer_2, testTracer_3, testTracer_4]

# Vial
testVial_1 = VialDataClass.fromDict({
  LEGACY_KEYWORD_CUSTOMER : 1,
  LEGACY_KEYWORD_CHARGE : "Test_batch_number",
  LEGACY_KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  LEGACY_KEYWORD_FILLTIME : time(7, 44,21),
  LEGACY_KEYWORD_VOLUME : 13.37,
  LEGACY_KEYWORD_ACTIVITY : 140123,
  LEGACY_KEYWORD_ID : 1,
  LEGACY_KEYWORD_ORDER_ID : None
})


testVial_1 = VialDataClass.fromDict({
  LEGACY_KEYWORD_CUSTOMER : 1,
  LEGACY_KEYWORD_CHARGE : "Test_batch_number",
  LEGACY_KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  LEGACY_KEYWORD_FILLTIME : time(7, 44,21),
  LEGACY_KEYWORD_VOLUME : 13.37,
  LEGACY_KEYWORD_ACTIVITY : 140123,
  LEGACY_KEYWORD_ID : 1,
  LEGACY_KEYWORD_ORDER_ID : None
})

testVial_2 = VialDataClass.fromDict({
  LEGACY_KEYWORD_CUSTOMER : 2,
  LEGACY_KEYWORD_CHARGE : "Test_batch_number",
  LEGACY_KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  LEGACY_KEYWORD_FILLTIME : time(7, 54,21),
  LEGACY_KEYWORD_VOLUME : 13.37,
  LEGACY_KEYWORD_ACTIVITY : 140123,
  LEGACY_KEYWORD_ID : 2,
  LEGACY_KEYWORD_ORDER_ID : None
})
testVial_3 = VialDataClass.fromDict({
  LEGACY_KEYWORD_CUSTOMER : 1,
  LEGACY_KEYWORD_CHARGE : "Test_batch_number",
  LEGACY_KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  LEGACY_KEYWORD_FILLTIME : time(7, 44,21),
  LEGACY_KEYWORD_VOLUME : 13.37,
  LEGACY_KEYWORD_ACTIVITY : 140123,
  LEGACY_KEYWORD_ID : 3,
  LEGACY_KEYWORD_ORDER_ID : None
})

testVial_4 = VialDataClass.fromDict({
  LEGACY_KEYWORD_CUSTOMER : 3,
  LEGACY_KEYWORD_CHARGE : "Test_batch_number",
  LEGACY_KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  LEGACY_KEYWORD_FILLTIME : time(7, 44,21),
  LEGACY_KEYWORD_VOLUME : 13.37,
  LEGACY_KEYWORD_ACTIVITY : 140123,
  LEGACY_KEYWORD_ID : 4,
  LEGACY_KEYWORD_ORDER_ID : None
})

testVials = [testVial_1, testVial_2, testVial_3, testVial_4]

# Powerful Stuff

TEST_DATA_DICT: Dict[Type[JsonSerilizableDataClass],
                     List[JsonSerilizableDataClass]] = { # type: ignore
    ActivityOrderDataClass : testOrders,
    CustomerDataClass : testCustomers,
    DeliverTimeDataClass : testDeliverDateTime,
    InjectionOrderDataClass : testTOrders,
    IsotopeDataClass : testIsotopes,
    RunsDataClass : testRuns,
    TracerDataClass : testTracers,
    VialDataClass : testVials
}

def useDataClassAsync(*DataClasses : Type[JsonSerilizableDataClass]):
  """
    This decorator initialized data into the test database and cleans up the data afterwards.
  """
  def decorator(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
      # Database Construction
      for DataClass in DataClasses:
        if DataClass == CustomerDataClass:
          UserRolePairs = []
          for testCustomer in testCustomers:
            await async_ExecuteQuery(
            CustomerDataClass.createDataClassQuery(testCustomer.to_dict()), Fetching.NONE)
            UserRolePairs.append(f"({testCustomer.ID},4)")
          await async_ExecuteQuery(f"""INSERT INTO UserRoles(Id_User, Id_Role) VALUES {", ".join(UserRolePairs)}""", Fetching.NONE)
        else:
          for testDataClass in TEST_DATA_DICT[DataClass]:
            try:
              await async_ExecuteQuery(
                DataClass.createDataClassQuery(
                testDataClass.to_dict()), Fetching.NONE)
            except IntegrityError:
              print(testDataClass)
      try:
        res = await func(*args, **kwargs)
      finally:
      # Database Deconstruction
        for DataClass in DataClasses:
          if DataClass == CustomerDataClass:
            UserIDs = ",".join(map(lambda U: str(U.ID), testCustomers))
            await async_ExecuteQuery(f"""DELETE FROM UserRoles WHERE Id_User IN ({UserIDs})""", Fetching.NONE)
            await async_ExecuteQuery(f"""DELETE FROM Users WHERE id IN ({UserIDs})""", Fetching.NONE)
          else:
            IDs = [str(dataInstance.__getattribute__(DataClass.getIDField())) for dataInstance in TEST_DATA_DICT[DataClass]]
            await async_ExecuteQuery(f"""DELETE FROM {DataClass.getSQLTable()} WHERE {DataClass.getIDField()} IN ({",".join(IDs)})""", Fetching.NONE)
      return res
    return wrapper
  return decorator

def useDataClass(*DataClasses : Type[JsonSerilizableDataClass]):
  def decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      # Database Construction
      for DataClass in DataClasses:
        if DataClass == CustomerDataClass:
          UserRolePairs = []
          for testCustomer in testCustomers:
            ExecuteQuery(
            CustomerDataClass.createDataClassQuery(testCustomer.to_dict()), Fetching.NONE)
            UserRolePairs.append(f"({testCustomer.ID},4)")
            ExecuteQuery(f"""INSERT INTO UserRoles(Id_User, Id_Role) VALUES {", ".join(UserRolePairs)}""", Fetching.NONE)
        else:
          for testDataClass in TEST_DATA_DICT[DataClass]:
              ExecuteQuery(
              DataClass.createDataClassQuery(
              testDataClass.to_dict()), Fetching.NONE)
      res = func(*args, **kwargs)
      # Database Deconstruction
      for DataClass in DataClasses:
        if DataClass == CustomerDataClass:
          UserIDs = ",".join(map(lambda U: str(U.ID), testCustomers))
          ExecuteQuery(f"""DELETE FROM UserRoles WHERE Id_User IN ({UserIDs})""", Fetching.NONE)
          ExecuteQuery(f"""DELETE FROM Users WHERE id IN ({UserIDs})""", Fetching.NONE)
        else:
          IDs = [str(dataInstance.__getattribute__(DataClass.getIDField())) for dataInstance in TEST_DATA_DICT[DataClass]]
          ExecuteQuery(f"""DELETE FROM {DataClass.getSQLTable()} WHERE {DataClass.getIDField()} IN ({",".join(IDs)})""", Fetching.NONE)
      return res
    return wrapper
  return decorator
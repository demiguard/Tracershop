from asgiref.sync import sync_to_async
from datetime import date, datetime, time, timedelta

import functools

from constants import *
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, InjectionOrderDataClass, IsotopeDataClass, JsonSerilizableDataClass, RunsDataClass, TracerDataClass, VialDataClass
from lib.SQL.SQLExecuter import ExecuteQuery, Fetching
from tests.helpers import async_ExecuteQuery

today = datetime.now()


# Async Functions


##### Customer Dataclasses #####
testCustomer_1 = CustomerDataClass.fromDict({
        KEYWORD_USERNAME : "test_username_1",
        KEYWORD_ID : 1,
        KEYWORD_OVERHEAD : 30,
        KEYWORD_CUSTOMER_NUMBER : 1,
        KEYWORD_REAL_NAME : "test_RealName_1",
        KEYWORD_EMAIL_1 : "test_email_1_1@doesntExists.com",
        KEYWORD_EMAIL_2 : "test_email_2_1@doesntExists.com",
        KEYWORD_EMAIL_3 : "test_email_3_1@doesntExists.com",
        KEYWORD_EMAIL_4 : "test_email_4_1@doesntExists.com",
        KEYWORD_CONTACT : "test_contact_1",
        KEYWORD_TELEFON_NUMBER : 20000000,
        KEYWORD_ADDRESS_1 : "test_address_1_1",
        KEYWORD_ADDRESS_2 : "test_address_2_1",
        KEYWORD_ADDRESS_3 : "test_address_3_1",
        KEYWORD_ADDRESS_4 : "test_address_4_1",
})

testCustomer_2 = CustomerDataClass.fromDict({
        KEYWORD_USERNAME : "test_username_2",
        KEYWORD_ID : 2,
        KEYWORD_OVERHEAD : 25,
        KEYWORD_CUSTOMER_NUMBER : 2,
        KEYWORD_REAL_NAME : "test_RealName_2",
        KEYWORD_EMAIL_1 : "test_email_1_2@doesntExists.com",
        KEYWORD_EMAIL_2 : "test_email_2_2@doesntExists.com",
        KEYWORD_EMAIL_3 : "test_email_3_2@doesntExists.com",
        KEYWORD_EMAIL_4 : "test_email_4_2@doesntExists.com",
        KEYWORD_CONTACT : "test_contact_2",
        KEYWORD_TELEFON_NUMBER : 10000000,
        KEYWORD_ADDRESS_1 : "test_address_1_2",
        KEYWORD_ADDRESS_2 : "test_address_2_2",
        KEYWORD_ADDRESS_3 : "test_address_3_2",
        KEYWORD_ADDRESS_4 : "test_address_4_2",
})

testCustomers = [testCustomer_1, testCustomer_2]

##### Deliver datetime #####
test_deliver_datetime_1 = DeliverTimeDataClass.fromDict({
    KEYWORD_BID : 1,
    KEYWORD_DAY : 3,
    KEYWORD_REPEAT : 2,
    KEYWORD_DELIVER_TIME : time(8,10,11),
    KEYWORD_RUN : 1,
    KEYWORD_DELIVER_TIME_ID : 1
})

test_deliver_datetime_2 = DeliverTimeDataClass.fromDict({
    KEYWORD_BID : 1,
    KEYWORD_DAY : 3,
    KEYWORD_REPEAT : 2,
    KEYWORD_DELIVER_TIME : time(11,22,33),
    KEYWORD_RUN : 2,
    KEYWORD_DELIVER_TIME_ID : 2
})

test_deliver_datetime_3 = DeliverTimeDataClass.fromDict({
    KEYWORD_BID : 2,
    KEYWORD_DAY : 3,
    KEYWORD_REPEAT : 2,
    KEYWORD_DELIVER_TIME : time(8,10,11),
    KEYWORD_RUN : 1,
    KEYWORD_DELIVER_TIME_ID : 3
})

test_deliver_datetime_4 = DeliverTimeDataClass.fromDict({
    KEYWORD_BID : 2,
    KEYWORD_DAY : 3,
    KEYWORD_REPEAT : 2,
    KEYWORD_DELIVER_TIME : time(11,22,33),
    KEYWORD_RUN : 2,
    KEYWORD_DELIVER_TIME_ID : 4
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
  KEYWORD_ID : 1,
  KEYWORD_NAME : "test_isotope_1",
  KEYWORD_HALFLIFE : 1337.0
})

testIsotope_2 = IsotopeDataClass.fromDict({
  KEYWORD_ID : 2,
  KEYWORD_NAME : "test_isotope_2",
  KEYWORD_HALFLIFE : 420.0
})

testIsotope_3 = IsotopeDataClass.fromDict({
  KEYWORD_ID : 3,
  KEYWORD_NAME : "test_isotope_3",
  KEYWORD_HALFLIFE : 69.0
})

testIsotopes = [testIsotope_1, testIsotope_2, testIsotope_3]

# orders

testOrder_1 = ActivityOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  KEYWORD_OID : 1,
  KEYWORD_STATUS : 2,
  KEYWORD_AMOUNT : 10000.0,
  KEYWORD_AMOUNT_O : 13000.0,
  KEYWORD_TOTAL_AMOUNT : 10000.0,
  KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  KEYWORD_TRACER : 1,
  KEYWORD_RUN : 1,
  KEYWORD_BID : 1,
  KEYWORD_BATCHNR : "",
  KEYWORD_COID : -1,
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_AMOUNT : None,
  KEYWORD_FREED_DATETIME : None,
  KEYWORD_VOLUME : None,
  KEYWORD_USERNAME_ORDERS : None,
  KEYWORD_COMMENT : None
})

testOrder_2 = ActivityOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  KEYWORD_OID : 2,
  KEYWORD_STATUS : 2,
  KEYWORD_AMOUNT : 10000.0,
  KEYWORD_AMOUNT_O : 13000.0,
  KEYWORD_TOTAL_AMOUNT : 10000.0,
  KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  KEYWORD_TRACER : 1,
  KEYWORD_RUN : 1,
  KEYWORD_BID : 1,
  KEYWORD_BATCHNR : "",
  KEYWORD_COID : -1,
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_AMOUNT : None,
  KEYWORD_FREED_DATETIME : None,
  KEYWORD_VOLUME : None,
  KEYWORD_USERNAME_ORDERS : None,
  KEYWORD_COMMENT : None
})

testOrder_3 = ActivityOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0),
  KEYWORD_OID : 3,
  KEYWORD_STATUS : 2,
  KEYWORD_AMOUNT : 10000.0,
  KEYWORD_AMOUNT_O : 13000.0,
  KEYWORD_TOTAL_AMOUNT : 10000.0,
  KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  KEYWORD_TRACER : 1,
  KEYWORD_RUN : 1,
  KEYWORD_BID : 1,
  KEYWORD_BATCHNR : "",
  KEYWORD_COID : -1,
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_AMOUNT : None,
  KEYWORD_FREED_DATETIME : None,
  KEYWORD_VOLUME : None,
  KEYWORD_USERNAME_ORDERS : None,
  KEYWORD_COMMENT : None
})

testOrder_4 = ActivityOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year,today.month,today.day,8,30,0) - timedelta(days = 100),
  KEYWORD_OID : 4,
  KEYWORD_STATUS : 2,
  KEYWORD_AMOUNT : 10000.0,
  KEYWORD_AMOUNT_O : 13000.0,
  KEYWORD_TOTAL_AMOUNT : 10000.0,
  KEYWORD_TOTAL_AMOUNT_O : 13000.0,
  KEYWORD_TRACER : 1,
  KEYWORD_RUN : 1,
  KEYWORD_BID : 1,
  KEYWORD_BATCHNR : "",
  KEYWORD_COID : -1,
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_AMOUNT : None,
  KEYWORD_FREED_DATETIME : None,
  KEYWORD_VOLUME : None,
  KEYWORD_USERNAME_ORDERS : None,
  KEYWORD_COMMENT : None
})

testOrders = [testOrder_1, testOrder_2, testOrder_3, testOrder_4]

# runs

testRun_1 = RunsDataClass.fromDict({
  KEYWORD_DAY : 3,
  KEYWORD_PRODUCTION_TIME : time(6,30,0),
  KEYWORD_RUN : 1,
  KEYWORD_PRODUCTION_ID : 1
})

testRun_2 = RunsDataClass.fromDict({
  KEYWORD_DAY : 3,
  KEYWORD_PRODUCTION_TIME : time(11,30,0),
  KEYWORD_RUN : 2,
  KEYWORD_PRODUCTION_ID : 2
})

testRun_3 = RunsDataClass.fromDict({
  KEYWORD_DAY : 4,
  KEYWORD_PRODUCTION_TIME : time(6,30,0),
  KEYWORD_RUN : 1,
  KEYWORD_PRODUCTION_ID : 3
})

testRuns = [testRun_1, testRun_2, testRun_3]

# t_orders

testTOrder_1 = InjectionOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0),
  KEYWORD_OID : 1,
  KEYWORD_STATUS : 2,
  KEYWORD_INJECTIONS : 2,
  KEYWORD_USAGE : "Human",
  KEYWORD_COMMENT : "",
  KEYWORD_USERNAME_ORDERS : "",
  KEYWORD_TRACER : 2,
  KEYWORD_BID : 2,
  KEYWORD_BATCHNR : "",
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_DATETIME : None,
})

testTOrder_2 = InjectionOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0),
  KEYWORD_OID : 2,
  KEYWORD_STATUS : 2,
  KEYWORD_INJECTIONS : 2,
  KEYWORD_USAGE : "Human",
  KEYWORD_COMMENT : "",
  KEYWORD_USERNAME_ORDERS : "",
  KEYWORD_TRACER : 2,
  KEYWORD_BID : 2,
  KEYWORD_BATCHNR : "",
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_DATETIME : None,
})

testTOrder_3 = InjectionOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0) + timedelta(days=33),
  KEYWORD_OID : 3,
  KEYWORD_STATUS : 2,
  KEYWORD_INJECTIONS : 2,
  KEYWORD_USAGE : "Human",
  KEYWORD_COMMENT : "",
  KEYWORD_USERNAME_ORDERS : "",
  KEYWORD_TRACER : 2,
  KEYWORD_BID : 2,
  KEYWORD_BATCHNR : "",
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_DATETIME : None,
})

testTOrder_4 = InjectionOrderDataClass.fromDict({
  KEYWORD_DELIVER_DATETIME : datetime(today.year, today.month, today.day, 9, 30, 0) - timedelta(days=14),
  KEYWORD_OID : 4,
  KEYWORD_STATUS : 2,
  KEYWORD_INJECTIONS : 2,
  KEYWORD_USAGE : "Human",
  KEYWORD_COMMENT : "",
  KEYWORD_USERNAME_ORDERS : "",
  KEYWORD_TRACER : 2,
  KEYWORD_BID : 2,
  KEYWORD_BATCHNR : "",
  KEYWORD_FREED_BY : None,
  KEYWORD_FREED_DATETIME : None,
})

testTOrders = [testTOrder_1, testTOrder_2, testTOrder_3, testTOrder_4]
# Tracer
testTracer_1 = TracerDataClass.fromDict({
  KEYWORD_SMALL_ID : 1,
  KEYWORD_NAME : "test_name_1",
  KEYWORD_ISOTOPE : 1,
  KEYWORD_INJECTIONS : 60,
  KEYWORD_ORDER_BLOCK : 33,
  KEYWORD_IN_USE : True,
  KEYWORD_TRACER_TYPE : 1,
  KEYWORD_LONG_NAME : "test_long_name_1"
})

testTracer_2 = TracerDataClass.fromDict({
  KEYWORD_SMALL_ID : 2,
  KEYWORD_NAME : "test_name_2",
  KEYWORD_ISOTOPE : 1,
  KEYWORD_INJECTIONS : 60,
  KEYWORD_ORDER_BLOCK : 33,
  KEYWORD_IN_USE : False,
  KEYWORD_TRACER_TYPE : 1,
  KEYWORD_LONG_NAME : "test_long_name_2"
})

testTracer_3 = TracerDataClass.fromDict({
  KEYWORD_SMALL_ID : 3,
  KEYWORD_NAME : "test_name_3",
  KEYWORD_ISOTOPE : 2,
  KEYWORD_INJECTIONS : 60,
  KEYWORD_ORDER_BLOCK : 33,
  KEYWORD_IN_USE : True,
  KEYWORD_TRACER_TYPE : 1,
  KEYWORD_LONG_NAME : "test_long_name_3"
})
testTracer_4 = TracerDataClass.fromDict({
  KEYWORD_SMALL_ID : 4,
  KEYWORD_NAME : "test_name_4",
  KEYWORD_ISOTOPE : 3,
  KEYWORD_INJECTIONS : 60,
  KEYWORD_ORDER_BLOCK : 33,
  KEYWORD_IN_USE : True,
  KEYWORD_TRACER_TYPE : 1,
  KEYWORD_LONG_NAME : "test_long_name_4"
})

testTracers = [testTracer_1, testTracer_2, testTracer_3, testTracer_4]

# Vial
testVial_1 = VialDataClass.fromDict({
  KEYWORD_CUSTOMER : 1,
  KEYWORD_CHARGE : "Test_batch_number",
  KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  KEYWORD_FILLTIME : time(7, 44,21),
  KEYWORD_VOLUME : 13.37,
  KEYWORD_ACTIVITY : 140123,
  KEYWORD_ID : 1,
  KEYWORD_ORDER_ID : None
})


testVial_1 = VialDataClass.fromDict({
  KEYWORD_CUSTOMER : 1,
  KEYWORD_CHARGE : "Test_batch_number",
  KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  KEYWORD_FILLTIME : time(7, 44,21),
  KEYWORD_VOLUME : 13.37,
  KEYWORD_ACTIVITY : 140123,
  KEYWORD_ID : 1,
  KEYWORD_ORDER_ID : None
})

testVial_2 = VialDataClass.fromDict({
  KEYWORD_CUSTOMER : 2,
  KEYWORD_CHARGE : "Test_batch_number",
  KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  KEYWORD_FILLTIME : time(7, 54,21),
  KEYWORD_VOLUME : 13.37,
  KEYWORD_ACTIVITY : 140123,
  KEYWORD_ID : 2,
  KEYWORD_ORDER_ID : None
})
testVial_3 = VialDataClass.fromDict({
  KEYWORD_CUSTOMER : 1,
  KEYWORD_CHARGE : "Test_batch_number",
  KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  KEYWORD_FILLTIME : time(7, 44,21),
  KEYWORD_VOLUME : 13.37,
  KEYWORD_ACTIVITY : 140123,
  KEYWORD_ID : 3,
  KEYWORD_ORDER_ID : None
})

testVial_4 = VialDataClass.fromDict({
  KEYWORD_CUSTOMER : 3,
  KEYWORD_CHARGE : "Test_batch_number",
  KEYWORD_FILLDATE : date(today.year, today.month, today.day),
  KEYWORD_FILLTIME : time(7, 44,21),
  KEYWORD_VOLUME : 13.37,
  KEYWORD_ACTIVITY : 140123,
  KEYWORD_ID : 4,
  KEYWORD_ORDER_ID : None
})

testVials = [testVial_1, testVial_2, testVial_3, testVial_4]

# Powerful Stuff

TEST_DATA_DICT = {
    ActivityOrderDataClass : testOrders,
    CustomerDataClass : testCustomers,
    DeliverTimeDataClass : testDeliverDateTime,
    InjectionOrderDataClass : testTOrders,
    IsotopeDataClass : testIsotopes,
    RunsDataClass : testRuns,
    TracerDataClass : testTracers,
    VialDataClass : testVials
}

def UseDataClass(*DataClasses : JsonSerilizableDataClass):
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
            await async_ExecuteQuery(
              DataClass.createDataClassQuery(
              testDataClass.to_dict()), Fetching.NONE)
      res = await func(*args, **kwargs)
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


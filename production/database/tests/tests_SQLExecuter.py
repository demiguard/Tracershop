""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from pprint import pprint
from threading import Thread, Event

# Third party packages
from django.test import TestCase

# Tracershop Production Packages
import constants
from core.exceptions import DatabaseInvalidQueriesConfiguration
from database.production_database import SQLExecuter, SQLFactory
from database.production_database.SQLExecuter import DataBaseConnectionWrapper, Fetching
from dataclass import ProductionDataClasses as PDC
from lib.utils import LMAP

# Test Packages
from tests.test_DataClasses import useDataClass, testDeliverDateTime
from tests.helpers import cleanTable



# There's a quite few #pragma: no cover in  SQLExecuter,
# This is cases where there the server have been incorrectly configured or can't connect to the database
# They are also there to make the debugging a bit eaiser by rasing queries if an invalid query is made

class SQLExecuterBasicsTestCase(TestCase):
  ##### Easy basic tests #####
  # These tests just shows the very basic use case for SQLExecuter
  isotope_tuple = { "name" : "test_isotope", "halflife" : 1337, "id" : 420}

  def tearDown(self) -> None:
    cleanTable("id", "isotopes", self._testMethodName)
    cleanTable("DTID", "deliverTimes", self._testMethodName)



  def test_insert_select_delete_isotope(self):
    insert_res = SQLExecuter.ExecuteQuery(f"""
        INSERT INTO isotopes(name, halflife, id)
            VALUES (\"{self.isotope_tuple["name"]}\",{self.isotope_tuple["halflife"]},{self.isotope_tuple["id"]})
    """, Fetching.NONE)

    select_res_1 = SQLExecuter.ExecuteQuery(f"""
        SELECT name, halflife, id FROM isotopes
    """)

    delete_res = SQLExecuter.ExecuteQuery("DELETE FROM isotopes WHERE id=420", Fetching.NONE)

    select_res_2 = SQLExecuter.ExecuteQuery(f"""
        SELECT name, halflife, id FROM isotopes
    """)

    self.assertIsNone(insert_res)
    self.assertIsNone(delete_res)
    self.assertListEqual([self.isotope_tuple], select_res_1)
    self.assertListEqual(select_res_2,[])

  def test_many_insert_select_delete_isotope(self):
    select_res_1 = SQLExecuter.ExecuteManyQueries([f"""INSERT INTO isotopes(name, halflife, id)
            VALUES (\"{self.isotope_tuple["name"]}\",{self.isotope_tuple["halflife"]},{self.isotope_tuple["id"]})
    """, f"""SELECT name, halflife, id FROM isotopes"""])
    select_res_2 = SQLExecuter.ExecuteManyQueries(["DELETE FROM isotopes WHERE id=420",
        f"""SELECT name, halflife, id FROM isotopes"""])

    self.assertListEqual([self.isotope_tuple], select_res_1)
    self.assertListEqual(select_res_2,[])

  def test_invalid_fetching_TrueFetchingIsNone_ExecuteQuery(self):
    self.assertRaises(DatabaseInvalidQueriesConfiguration, SQLExecuter.ExecuteQuery, f"""INSERT INTO isotopes(name, halflife, id)
            VALUES (\"{self.isotope_tuple["name"]}\",{self.isotope_tuple["halflife"]},{self.isotope_tuple["id"]})
    """, Fetching.ALL)

    self.assertEqual(SQLExecuter.ExecuteQuery(f"""
        SELECT name, halflife, id FROM isotopes
    """), [])


  def test_invalid_fetching_TrueFetchingIsNone_ExecuteManyQueries(self):
    self.assertRaises(DatabaseInvalidQueriesConfiguration, SQLExecuter.ExecuteManyQueries, [f"""INSERT INTO isotopes(name, halflife, id)
            VALUES (\"{self.isotope_tuple["name"]}\",{self.isotope_tuple["halflife"]},{self.isotope_tuple["id"]})
    """], Fetching.ALL)

    self.assertEqual(SQLExecuter.ExecuteQuery(f"""
        SELECT name, halflife, id FROM isotopes
    """), [])



  # Actual tests

  def test_many_query_rollback(self):
    """Tests if ExecuteManyQueries query rolls back after invalid an invalid Query"""
    invalidQuery = f"""SELECT name, halflife, id, doesntExists FROM isotopes"""
    self.assertRaisesMessage(
        DatabaseInvalidQueriesConfiguration, invalidQuery, SQLExecuter.ExecuteManyQueries,[
            f"""INSERT INTO isotopes(name, halflife, id)
            VALUES (\"{self.isotope_tuple["name"]}\",{self.isotope_tuple["halflife"]},{self.isotope_tuple["id"]})""",
            invalidQuery])
    select_res_2 = SQLExecuter.ExecuteQuery(f"""
        SELECT name, halflife, id FROM isotopes
    """)
    self.assertListEqual(select_res_2,[])

  def test_race_weaving_threads(self):
    """This test cases shows if there's two threads racing to create an object,
        Weaving the operations provices correct results
    """
    insert_query = "INSERT INTO isotopes(name,halflife) VALUES (\"thread\", 69)"
    select_query = "SELECT id FROM isotopes WHERE id=(SELECT MAX(id) FROM isotopes)"

    SQLExecuter.ExecuteQuery(insert_query, Fetching.NONE)

    e1 = Event()
    e2 = Event()

    t1_query_res = []
    t2_query_res = []

    def t1_func():
      with DataBaseConnectionWrapper() as wrapper:
        e1.set()
        e2.wait()
        e2.clear()
        wrapper.cursor.execute(insert_query)
        e1.set()
        e2.wait()
        e2.clear()
        wrapper.cursor.execute(select_query)
        t1_query_res.append(wrapper.cursor.fetchall())
        e1.set()
        e2.wait()
        e2.clear()
        wrapper.connection.commit()
        e1.set()

    def t2_func():
      e1.wait()
      e1.clear()
      with DataBaseConnectionWrapper() as wrapper:
        e2.set()
        e1.wait()
        e1.clear()
        wrapper.cursor.execute(insert_query)
        e2.set()
        e1.wait()
        e1.clear()
        wrapper.cursor.execute(select_query)
        t2_query_res.append(wrapper.cursor.fetchall())
        e2.set()
        e1.wait()
        e1.clear()
        wrapper.connection.commit()

    t1 = Thread(target=t1_func)
    t2 = Thread(target=t2_func)

    t1.start()
    t2.start()

    t1.join()
    t2.join()

    SQLExecuter.ExecuteQuery("""DELETE FROM isotopes WHERE halflife=69""", Fetching.NONE)
    self.assertEqual((t1_query_res[0])[0]["id"] + 1, (t2_query_res[0])[0]["id"])

  @useDataClass(PDC.DeliverTimeDataClass)
  def test_GetAll_deliverTimes(self):
    selectQuery = SQLFactory.getDataClass(PDC.DeliverTimeDataClass)
    result = SQLExecuter.ExecuteQuery(selectQuery, Fetching.ALL)
    target = [PDC.DeliverTimeDataClass(**deliver_time_data_class)
              for deliver_time_data_class in result]
    self.assertListEqual(target, testDeliverDateTime)

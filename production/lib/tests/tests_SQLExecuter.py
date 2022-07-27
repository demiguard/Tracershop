
from django.test import TestCase
from lib import ProductionDataClasses as PDC
import constants
from lib.SQL import SQLExecuter
from lib.SQL.SQLExecuter import DataBaseConnectionWrapper, Fetching
from lib.expections import DatabaseInvalidQueriesConfiguration

from threading import Thread, Event

class SQLExecuterBasicsTestCase(TestCase):
    ##### Easy basic tests #####
    # These tests just shows the very basic use case for SQLExecuter
    isotope_tuple = ("test_isotope", 1337, 420)


    def test_insert_select_delete_isotope(self):
        insert_res = SQLExecuter.ExecuteQuery(f"""
            INSERT INTO isotopes(name, halflife, id)
                VALUES (\"{self.isotope_tuple[0]}\",{self.isotope_tuple[1]},{self.isotope_tuple[2]})
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
                VALUES (\"{self.isotope_tuple[0]}\",{self.isotope_tuple[1]},{self.isotope_tuple[2]})
        """, f"""SELECT name, halflife, id FROM isotopes"""])
        select_res_2 = SQLExecuter.ExecuteManyQueries(["DELETE FROM isotopes WHERE id=420",
            f"""SELECT name, halflife, id FROM isotopes"""])

        self.assertListEqual([self.isotope_tuple], select_res_1)
        self.assertListEqual(select_res_2,[])

    # Actual tests
    def test_many_query_rollback(self):
        """Tests if ExecuteManyQueries query rolls back after invalid an invalid Query"""
        invalidQuery = f"""SELECT name, halflife, id, doesntExists FROM isotopes"""
        self.assertRaisesMessage(
            DatabaseInvalidQueriesConfiguration, invalidQuery, SQLExecuter.ExecuteManyQueries,[
                f"""INSERT INTO isotopes(name, halflife, id)
                VALUES (\"{self.isotope_tuple[0]}\",{self.isotope_tuple[1]},{self.isotope_tuple[2]})""",
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
        self.assertEqual((t1_query_res[0])[0][0] + 1, (t2_query_res[0])[0][0])


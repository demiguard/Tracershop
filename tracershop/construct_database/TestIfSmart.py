import mysql.connector as mysql

DBConfig = {
  'user' : "tracershop",
  'password' : "fdg4sale",
  'host' : "127.0.0.1",
  'port' : '5000',
  'database': "TS_test",
  'raise_on_warnings': True,
  'autocommit':True,
}

conn = mysql.connect(**DBConfig)
cursor = conn.cursor()

SQL = """
  SELECT
    order_time
  FROM
    t_orders
  LIMIT 1
"""
cursor.execute(SQL)

print(cursor.fetchall())


#DIS WORKS

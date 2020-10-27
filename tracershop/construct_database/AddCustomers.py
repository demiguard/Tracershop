import mysql.connector as mysql

# No it's not optimal but you should only run this once very blue moon, so bad performance doesn't matter


##### Helper functions #####
def is_already_in_database(cursor, userID):
  sqlQuery = f"""
    SELECT 
      Count(*)
    FROM 
      customer_customer
    where
      ID={userID}
  """
  cursor.execute(sqlQuery)
  res = cursor.fetchone()[0]
  print(res)
  if res:
    return True
  return False

def insert_user(cursor, userID, name):
  sqlQuery = f"""
    INSERT INTO customer_customer (ID, customerName, is_REGH)
    VALUES ({userID}, \"{name}\", 0)
  """
  cursor.execute(sqlQuery)

##### Accual code

# Connect to databases
database_1_config = {
  'user' : "tracershop",
  'password' : "tracer",
  'host' : "localhost",
  'port' : '3306',
  'database': "tracershop",
  'raise_on_warnings': True,
  'autocommit':True,
}
database_2_config = {
  'user' : "tracershop",
  'password' : "tracer",
  'host' : "localhost",
  'port' : '3306',
  'database': "tracerstore",
  'raise_on_warnings': True,
  'autocommit':True,
}


conn_1 = mysql.connect(**database_1_config)
cursor_old = conn_1.cursor()
conn_2 = mysql.connect(**database_2_config)
cursor_new = conn_2.cursor()

# Find Old users
OldUsersQuery = f"""
  SELECT 
    ID,
    username
  FROM
    Users
"""
cursor_old.execute(OldUsersQuery)


for query in cursor_old.fetchall():
  print(query)
  if not(is_already_in_database(cursor_new, query[0])):
    print("Inserting")
    insert_user(cursor_new, query[0], query[1])

conn_1.close()
conn_2.close()

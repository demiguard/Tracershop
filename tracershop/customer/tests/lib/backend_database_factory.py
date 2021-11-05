import mysql.connector as mysql

def create_test_backend():
  db_config = {
    'user' : "tracershop",
    "password" : "tracer",
    "host"     : "127.0.0.1"
  }

  conn = mysql.connect(**db_config)
  cur = conn.cursor()

  cur.execute("CREATE DATABASE test_backend")

def destroy_test_backend():
  db_config = {
    'user' : "tracershop",
    "password" : "tracer",
    "host"     : "127.0.0.1"
  }

  conn = mysql.connect(**db_config)
  cur = conn.cursor()

  cur.execute("DROP DATABASE test_backend")
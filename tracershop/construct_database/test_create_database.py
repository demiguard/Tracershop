import mysql.connector as mysql


if __name__ == "__main__":
  db_config = {
    'user' : "tracershop",
    "password" : "tracer",
    "host"     : "127.0.0.1"
  }

  conn = mysql.connect(**db_config)
  cur = conn.cursor()

  cur.execute("""CREATE DATABASE test_backend """)

  cur.execute("""SHOW DATABASES""")

  cur.execute("""DELETE DATABASE test_backend""")
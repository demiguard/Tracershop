"""

"""

import functools
import mysql.connector as mysql

from database.models import Address, Database, User, UserGroups

from asgiref.sync import sync_to_async
from lib.SQL.SQLController import SQL
from lib.SQL.SQLExecuter import Fetching, ExecuteQuery

from pprint import pprint

__author__ = "Christoffer Vilstrup Jensen"


TEST_ADMIN_USERNAME = "test_admin"
TEST_ADMIN_PASSWORD = "test_admin_password"

TEST_PRODUCTION_USERNAME = "test_production"
TEST_PRODUCTION_PASSWORD = "test_production_password"


def InitializeDjangoDatabase(DatabaseConfig, testDatabaseName):
  add = Address(
    ip="127.0.0.1",
    port="3306",
    description="Test legacy Database"
  ).save()
  Database(
    databaseName=testDatabaseName,
    username=DatabaseConfig["USER"],
    password=DatabaseConfig["PASSWORD"],
    address=Address.objects.all()[0],
    testinDatabase=True
    ).save()

  SC = SQL.getServerConfig()

  test_admin = User(id=1, username=TEST_ADMIN_USERNAME, UserGroup=UserGroups.Admin, OldTracerBaseID=1337)
  test_admin.set_password(TEST_ADMIN_PASSWORD)
  test_admin.save()

  test_production = User(id=2, username=TEST_PRODUCTION_USERNAME, UserGroup=UserGroups.ProductionAdmin, OldTracerBaseID=420)
  test_production.set_password(TEST_PRODUCTION_PASSWORD)
  test_production.save()


def CreateTestDatabase(DatabaseConfig):
  """
    This function creates a test legacy database

    Returns:
      databaseName
  """

  databaseName = "test_tracershop"

  db_config = {
    'user' : DatabaseConfig["USER"],
    "password" : DatabaseConfig["PASSWORD"],
    "host"     : DatabaseConfig["HOST"],
    "port"     : DatabaseConfig["PORT"]
  }

  conn = mysql.connect(**db_config)
  cur = conn.cursor()

  cur.execute(f"""DROP DATABASE IF EXISTS {databaseName}""")

  cur.execute(f"""
    CREATE DATABASE {databaseName}
  """)

  cur.execute(f"""
    use {databaseName}
  """)

  cur.execute("""
  CREATE TABLE Roles (
    Id INT NOT NULL AUTO_INCREMENT,
    Rolename CHAR(20) NOT NULL,
    REALM CHAR(10),
    PRIMARY KEY (Id)
  )
  """)

  cur.execute("""
    INSERT INTO Roles(Id, Rolename, Realm) VALUES
    (1, \"Manager\", \"*\"),
    (4, \"Kunde\", \"*\"),
    (5, \"Transport\", \"*\"),
    (6, \"Produktion\", \"*\"),
    (7, \"Statistik\", \"*\")
  """)

  cur.execute("""
  CREATE TABLE TracerCustomer(tracer_id INT, customer_id INT)
  """)

  cur.execute("""
  CREATE TABLE IF NOT EXISTS tracer_types(
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(300) DEFAULT ""
  )""")

  cur.execute("""
  INSERT INTO tracer_types(
    description
  ) VALUES ("Activity Tracer"), ("Dose Tracer");
  """)


  cur.execute("""
    CREATE TABLE Tracers(
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(60),
    isotope INT,
    in_use BOOL NOT NULL DEFAULT FALSE,
    n_injections INT DEFAULT -1,
    order_block INT,
    tracer_type INT REFERENCES tracer_types(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL,
    longName VARCHAR(256),
    PRIMARY KEY (id)
  )""")

  cur.execute("""
    CREATE TABLE UserRoles(
      Id_User INT,
      Id_Role INT,
      PRIMARY KEY (Id_User, Id_Role)
    )
  """)

  cur.execute("""
    CREATE TABLE Users(
      Id INT AUTO_INCREMENT NOT NULL,
      PRIMARY KEY (Id),
      Username CHAR(60) NOT NULL,
      Realname CHAR(50),
      EMail CHAR(60),
      EMail2 CHAR(60),
      EMail3 CHAR(60),
      EMail4 CHAR(60),
      overhead INT,
      kundenr INT,
      tlf INT,
      contact VARCHAR(60),
      addr1 VARCHAR(60),
      addr2 VARCHAR(60),
      addr3 VARCHAR(60),
      addr4 VARCHAR(60),
      shortname VARCHAR(30),
      password VARCHAR(32)
    )
  """)



  cur.execute("""
  CREATE TABLE orders(
    BID INT,
    OID INT PRIMARY KEY AUTO_INCREMENT,
    order_time TIMESTAMP
      NOT NULL
      DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP,
    amount INT,
    deliver_datetime DATETIME,
    status TINYINT,
    batchnr varchar(20),
    run TINYINT,
    COID INT,
    total_amount INT,
    frigivet_amount INT,
    frigivet_datetime DATETIME,
    amount_o INT UNSIGNED,
    total_amount_o INT UNSIGNED,
    frigivet_af INT,
    tracer INT NOT NULL,
    volume DECIMAL(6,2),
    doser DECIMAL(6,1),
    comment VARCHAR(8000),
    userName VARCHAR(128)
  )
  """)

  cur.execute("""
    CREATE TABLE VAL(
      customer VARCHAR(20),
      charge VARCHAR(20),
      deposPos TINYINT(4),
      filldate DATE,
      filltime TIME,
      volume DECIMAL(7,2),
      gros DECIMAL(7,2),
      tare DECIMAL(7,2),
      net  DECIMAL(7,2),
      product VARCHAR(20),
      ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      activity DECIMAL(9,2),
      order_id int DEFAULT NULL REFERENCES orders(oid) ON UPDATE CASCADE ON DELETE RESTRICT
    )
  """)

  #cur.execute("""
  #CREATE TABLE VialMapping(
  #Order_id INT,
  #VAL_id INT UNSIGNED,
  #FOREIGN KEY (Order_id) REFERENCES orders(OID)
  #  ON UPDATE CASCADE
  #  ON DELETE RESTRICT,
  #FOREIGN KEY (VAL_id) REFERENCES VAL(ID)
  #  ON UPDATE CASCADE
  #  ON DELETE RESTRICT,
  #UNIQUE KEY (VAL_id)
  #)
  #""")

  cur.execute("""
    CREATE TABLE productionTimes(
      day TINYINT,
      ptime TIME,
      run TINYINT,
      max INT,
      PTID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT
    )
  """)

  cur.execute("""
    CREATE TABLE isotopes(
      name VARCHAR(60),
      halflife INT,
      id INT PRIMARY KEY AUTO_INCREMENT
    )
  """)

  cur.execute("""
    CREATE TABLE blockDeliverDate(
      BDID INT PRIMARY KEY AUTO_INCREMENT,
      ddate DATE
    )
  """)

  cur.execute("""
  CREATE TABLE deliverTimes(
    BID INT,
    day TINYINT,
    repeat_t TINYINT,
    dtime TIME,
    max INT,
    DTID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    run TINYINT
    )
  """)

  cur.execute("""
    CREATE TABLE t_orders(
      BID INT,
      OID INT PRIMARY KEY AUTO_INCREMENT,
      order_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deliver_datetime DATETIME,
      status TINYINT,
      batchnr VARCHAR(20),
      run TINYINT,
      COID INT,
      frigivet_datetime datetime,
      frigivet_af INT,
      tracer INT,
      n_injections TINYINT,
      anvendelse VARCHAR(10),
      comment VARCHAR(8000),
      userName VARCHAR(128)
    )
  """)


  conn.close()
  return databaseName

def DestroyTestDatabase(DatabaseConfig):
  db_config = {
    'user' : DatabaseConfig["USER"],
    "password" : DatabaseConfig["PASSWORD"],
    "host"     : DatabaseConfig["HOST"],
    "port"     : DatabaseConfig["PORT"]
  }

  conn = mysql.connect(**db_config)
  cur = conn.cursor()
  cur.execute("""
    DROP DATABASE test_tracershop
  """)

  conn.close()

@sync_to_async
def getModel(model, pk):
  return model.objects.get(pk=pk)

@sync_to_async
def async_ExecuteQuery(Query, fetching=Fetching.ALL):
    return ExecuteQuery(Query, fetching)
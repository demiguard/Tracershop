__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
import logging
from enum import Enum
from typing import Any, Dict, List, Optional

# Third party packages
import mysql.connector as mysql
from mysql.connector import MySQLConnection
from mysql.connector.cursor import MySQLCursor

# Tracershop Production packages
from database.models import Database, DatabaseType
from database.production_database.SQLFormatter import checkForSQLInjection
from core.exceptions import DatabaseNotSetupException

logger = logging.getLogger("SQLLogger")

class Fetching(Enum):
  ALL = 1
  ONE = 2
  NONE = 3


class ProductionDatabase():
  """This class represents a production database

  Raises:
      DatabaseNotSetupException: _description_

  Returns:
      _type_: _description_
  """

  autoCommit = True
  raiseOnWarnings = True

  def __init__(self,database: Database) -> None:
    self._database = database

    self._connection = self._refresh_database()


  def _refresh_database(self) -> MySQLConnection:
    self._database.refresh_from_db()
    if self._database.address is None:
      logger.error("Database doesn't have an Address")
      raise DatabaseNotSetupException

    databaseConfig = {
      'database' : self._database.databaseName,
      'user' : self._database.username,
      'password' : self._database.password,
      'host' : self._database.address.ip,
      'port' : self._database.address.port,
      'autocommit' : self.autoCommit,
      'raise_on_warnings': self.raiseOnWarnings,
    }

    connection: MySQLConnection = mysql.connect(**databaseConfig) # type: ignore
    connection.get_warnings = True
    return connection


  def GetCursor(self) -> MySQLCursor:
    try:
      self._connection.ping(reconnect=True, attempts=3, delay=1)
    except:
      self._connection = self._refresh_database()
    return self._connection.cursor(dictionary=True) # type: ignore


  def ExecuteQuery(self, Query: str, Fetch: Fetching) -> Optional[List[Dict[str, Any]]]:
    checkForSQLInjection(Query)
    logger.debug(Query)
    SuccessCursorClosure = False # Default Value

    cursor = self.GetCursor()
    try:
      cursor.execute(Query)
      warns = cursor.fetchwarnings()
      if warns: # pragma: no cover
        logger.warn(warns)
      if Fetch == Fetching.ALL:
        RawQueryResult = cursor.fetchall()
      if Fetch == Fetching.ONE:
        RawQueryResult = cursor.fetchone()
        # Boilerplate code needed as an exception is raised when fetching from a query with no output
        if RawQueryResult is not None:
          RawQueryResult = [RawQueryResult]
      else:
        RawQueryResult = None

      self._connection.commit()
      SuccessCursorClosure = cursor.close()
    except mysql.Error as exception:
      self._connection.rollback()
      logger.error(f"Could not complete Query:\n{Query}")
      SuccessCursorClosure = cursor.close()
      raise exception
    else:
      if Fetch == Fetching.ALL or Fetch == Fetching.ONE:
        return RawQueryResult
    finally:
      if not SuccessCursorClosure:
        logger.error("Could not close the cursor")

  def ExecuteManyQueries(self, Queries: List[str], Fetch: Fetching):
    for Query in Queries:
      checkForSQLInjection(Query)
    cursor = self.GetCursor()
    SuccessCursorClosure = False

    try:
      for Query in Queries:
        cursor.execute(Query)
        warns = cursor.fetchwarnings()
        if warns: # pragma: no cover
          logger.warn(warns)
      if Fetch == Fetching.ALL:
        RawQueryResult = cursor.fetchall()
      if Fetch == Fetching.ONE:
        RawQueryResult = [cursor.fetchone()]
      else:
        RawQueryResult = None

      self._connection.commit()
      SuccessCursorClosure = cursor.close()
    except mysql.Error:
      logger.error(f"Could not complete Queries:\n{Queries}")
      self._connection.rollback()
      SuccessCursorClosure = cursor.close()
    else:
      if Fetch == Fetching.ALL or Fetch == Fetching.ONE and "RawQueryResult" not in locals().keys():
        return RawQueryResult
    finally:
      if not SuccessCursorClosure:
        logger.error("Could not close the cursor")

  def build_legacy_production_database(self):

    if self._database.databaseType != DatabaseType.TracershopProductionDatabaseLegacy:
      logger.error("Attempting to Create a Legacy database in a none legacy database")
      logger.error("Attempting to Create a Legacy database in a none legacy database")
      raise Exception
    cursor = self.GetCursor()
    cursor.execute("""
    CREATE TABLE Roles IF NOT EXISTS (
      Id INT NOT NULL AUTO_INCREMENT,
      Rolename CHAR(20) NOT NULL,
      REALM CHAR(10),
      PRIMARY KEY (Id)
    )
    """)

    cursor.execute("""
      INSERT INTO Roles(Id, Rolename, Realm) VALUES
      (1, \"Manager\", \"*\"),
      (4, \"Kunde\", \"*\"),
      (5, \"Transport\", \"*\"),
      (6, \"Produktion\", \"*\"),
      (7, \"Statistik\", \"*\")
    """)

    cursor.execute("""
    CREATE TABLE TracerCustomer IF NOT EXISTS(
      tracer_id INT,
      customer_id INT,
      ID INT AUTO_INCREMENT PRIMARY KEY
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tracer_types(
      id INT AUTO_INCREMENT PRIMARY KEY,
      description VARCHAR(300) DEFAULT ""
    )""")

    cursor.execute("""
    INSERT INTO tracer_types(
      description
    ) VALUES ("Activity Tracer"), ("Dose Tracer");
    """)


    cursor.execute("""
      CREATE TABLE Tracers IF NOT EXISTS(
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

    cursor.execute("""
      CREATE TABLE UserRoles IF NOT EXISTS(
        Id_User INT,
        Id_Role INT,
        PRIMARY KEY (Id_User, Id_Role)
      )
    """)

    cursor.execute("""
      CREATE TABLE Users IF NOT EXISTS(
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



    cursor.execute("""
    CREATE TABLE orders IF NOT EXISTS(
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

    cursor.execute("""
      CREATE TABLE VAL IF NOT EXISTS(
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

    cursor.execute("""
      CREATE TABLE productionTimes IF NOT EXISTS(
        day TINYINT,
        ptime TIME,
        run TINYINT,
        max INT,
        PTID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT
      )
    """)

    cursor.execute("""
      CREATE TABLE isotopes IF NOT EXISTS(
        name VARCHAR(60),
        halflife INT,
        id INT PRIMARY KEY AUTO_INCREMENT
      )
    """)

    cursor.execute("""
      CREATE TABLE blockDeliverDate IF NOT EXISTS(
        BDID INT PRIMARY KEY AUTO_INCREMENT,
        ddate DATE
      )
    """)

    cursor.execute("""
    CREATE TABLE deliverTimes IF NOT EXISTS(
      BID INT,
      day TINYINT,
      repeat_t TINYINT,
      dtime TIME,
      max INT,
      DTID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      run TINYINT
      )
    """)

    cursor.execute("""
      CREATE TABLE t_orders IF NOT EXISTS(
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

    cursor.close()

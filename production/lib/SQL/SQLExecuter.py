import mysql.connector as mysql
import enum
from typing import List
from pprint import pprint

import logging

# User packages:
import constants
from lib.SQL.SQLFormatter import checkForSQLInjection
from database.models import Database, ServerConfiguration
from lib.expections import DatabaseNotSetupException, DatabaseCouldNotConnect, DatabaseInvalidQueriesConfiguration

__author__ = "Christoffer Vilstrup Jensen"

logger = logging.getLogger("SQLLogger")
logger.setLevel(logging.DEBUG)

class Fetching(enum.Enum):
  ALL = 1
  ONE = 2
  NONE = 3

class DataBaseConnectionWrapper(object):
  def __init__(self):
    pass
  def __enter__(self):
    try:
      SC = ServerConfiguration.objects.get(ID=1)
    except ServerConfiguration.DoesNotExist:
      raise DatabaseNotSetupException
    database = SC.ExternalDatabase
    databaseConfig = {
      'database' : database.databaseName,
      'user' : database.username,
      'password' : database.password,
      'host' : database.address.ip,
      'port' : database.address.port,
      'autocommit' : False,
      'raise_on_warnings': True
    }
    self.databaseConfig = databaseConfig

    try:
      self.connection = mysql.connect(**databaseConfig)
      self.connected = True
      self.connection.get_warnings = True
      self.cursor = self.connection.cursor()
      return self
    except mysql.Error as Err:
      self.connected = False
      return self
  def __exit__(self, type, value, traceback):
    if self.connected:
      self.connection.close()

def ExecuteQuery(Query : str, fetch = Fetching.ALL):
  with DataBaseConnectionWrapper() as Wrapper:
    if Wrapper.connected:
      checkForSQLInjection(Query)
      logger.debug(Query)
      Wrapper.cursor.execute(Query)
      warns = Wrapper.cursor.fetchwarnings()
      if warns:
        logger.warn(warns)
      if fetch == Fetching.ALL and Wrapper.cursor.with_rows:
        FetchedVals = Wrapper.cursor.fetchall()
      elif fetch == Fetching.ONE and Wrapper.cursor.with_rows:
        FetchedVals = Wrapper.cursor.fetchone()
      if "FetchedVals" not in locals().keys() and fetch != Fetching.NONE:
        Wrapper.connection.rollback()
        raise DatabaseInvalidQueriesConfiguration(Query)
      Wrapper.connection.commit()
    else:
      pprint(Wrapper.databaseConfig)
      raise DatabaseCouldNotConnect
  if fetch != Fetching.NONE:
    return FetchedVals

def ExecuteManyQueries(SQLQueries : List[str], fetch=Fetching.ALL):
  with DataBaseConnectionWrapper() as Wrapper:
    if Wrapper.connected:
      Wrapper.connection.autocommit = False
      try:
        for Query in SQLQueries:
          logger.debug(Query)
          Wrapper.cursor.execute(Query)
          warns = Wrapper.cursor.fetchwarnings()
          if warns:
            logger.warn(warns)
          if fetch == Fetching.ALL and Wrapper.cursor.with_rows:
            FetchedVals = Wrapper.cursor.fetchall()
          elif fetch == Fetching.ONE and Wrapper.cursor.with_rows:
            FetchedVals = Wrapper.cursor.fetchone()
        if "FetchedVals" not in locals().keys() and fetch != Fetching.NONE:
          Wrapper.connection.rollback()
          raise DatabaseInvalidQueriesConfiguration(Query)
        Wrapper.connection.commit()
      except mysql.Error as Err:
        Wrapper.connection.rollback()
        raise DatabaseInvalidQueriesConfiguration(Query)
  if fetch != Fetching.NONE:
    return FetchedVals

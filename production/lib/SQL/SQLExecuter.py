import mysql.connector as mysql
from lib.SQL.SQLFormatter import checkForSQLInjection
# User packages:

# This is some legacy code that should really be moved
from api.models import Database
import constants

from lib.expections import DatabaseNotSetupException, DatabaseCouldNotConnect


class MySQLCursor(object):
  def __init__(self):
    pass
  def __enter__(self):
    databaseQuery = Database.objects.filter(databaseName=constants.TRACERSHOPDATABASENAME)
    if not databaseQuery:
      raise DatabaseNotSetupException
    database = databaseQuery[0]
    databaseConfig = {
      'database' : database.databaseName,
      'user' : database.username,
      'password' : database.password,
      'host' : database.address.ip,
      'port' : database.address.port,
      'autocommit' : True,
      'raise_on_warnings': True
    }
    try:
      self.connection = mysql.connect(**databaseConfig)
      self.connected = True
      self.cursor = self.connection.cursor()
      return self.cursor
    except mysql.Error as Err:
      self.connected = False
      return None
  def __exit__(self, type, value, traceback):
    if self.connected:
      self.connection.close()



def ExecuteQueryFetchOne(SQLQuery : str):
  with MySQLCursor() as cursor:
    if cursor:
      checkForSQLInjection(SQLQuery)
      cursor.execute(SQLQuery)
      FetchedVal = cursor.fetchone()
    else:
      raise DatabaseCouldNotConnect
  return FetchedVal

def ExecuteQueryFetchAll(SQLQuery : str) -> list:
  with MySQLCursor() as cursor:
    if cursor:
      checkForSQLInjection(SQLQuery)
      cursor.execute(SQLQuery)
      FetchedVals = cursor.fetchall()
    else:
      raise DatabaseCouldNotConnect
  return FetchedVals

def ExecuteQuery(SQLQuery : str) -> None:
  with MySQLCursor() as cursor:
    if cursor:
      checkForSQLInjection(SQLQuery)
      cursor.execute(SQLQuery)
    else:
      raise DatabaseCouldNotConnect
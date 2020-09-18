import logging
import time

from logging.handlers import SysLogHandler

#Custompackages 
import pingServiceConfig as config
#Pip packages
import pydicom
import pynetdicom
from pynetdicom.sop_class import ModalityWorklistInformationFind

#Mysql
import mysql.connector as mysql
from mysql.connector import errorcode

#Mysql cursor because they couldn't be bothered to implement it in the mysql lib
class MysqlCursor(object):
  def __init__(self):
    pass
  def __enter__(self):
    try:
      self.cursor = mysql.connect(**config.DBConfig)
      self.connected = True
      logger.info("Successfully connected to The Database")
      return self.cursor
    except mysql.Error as Err:
      logger.info(f"Failed to connect to the Database because {Err}")
      self.connected = False
      return None
  def __exit__(self, type, value, traceback):
    if self.connected:
      self.cursor.close()
    

#Starting the service
if __name__ == "__main__":
  logger = logging.getLogger("pingLogger")
  logging.basicConfig(filename=config.loggingPath, level=logging.DEBUG)

  ae = pynetdicom.AE()
  while(True):
    



    with MysqlCursor() as sql:
      if sql:
        pass


    logger.info("This happens")
    time.sleep(5)
    
  
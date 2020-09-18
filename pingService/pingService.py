import logging
import time

from datetime import datetime, timedelta
from logging.handlers import SysLogHandler
#Custompackages 
import pingServiceConfig as config
#Pip packages
import pydicom
from pydicom import Dataset
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
      self.connection = mysql.connect(**config.DBConfig)
      self.connected = True
      logger.info("Successfully connected to The Database")
      return self.connection.cursor()
    except mysql.Error as Err:
      logger.info(f"Failed to connect to the Database because {Err}")
      self.connected = False
      return None
  def __exit__(self, type, value, traceback):
    if self.connected:
      self.connection.close()
    

class MyDicomConnection(object):
  def __init__(self, ae, ip, port, aet):
    self.ae = ae
    self.ip = ip
    self.port = port
    self.aet  = aet
  def __enter__(self):
    self.assoc = self.ae.associate(
      self.ip,
      int(self.port),
      ae_title = self.aet
    )
    if self.assoc.is_established:
      return self.assoc
    else:
      logger.error(f"Could not Etablish the connection to {self.ip}:{self.port} - {self.aet}")
      return None
  def __exit__(self, type, value, traceback):
    if self.assoc.is_established:
      self.assoc.release()


def getConnectionParameters(cursor):
  """
    Retreives the RIS connection from the database
  """
  sqlQuery = """
    SELECT 
      ip, port, AET
    FROM
      customer_aet inner join customer_address
    WHERE
      description="Address for RIS"
  """
  cursor.execute(sqlQuery)
  query = cursor.fetchall()[0]
  return {
    'ip' : query[0],
    'port' : query[1],
    'aet' : query[2]
  }

def getQueryDataset(cursor):
  ds = Dataset()
  item = Dataset()
  item.ScheduledStationAETitle = 'RHKFATBUK561'
  item.ScheduledProcedureStepStartDate = datetime.strftime(datetime.today()+timedelta(days=1), '%Y%m%d')+'-'
  item.ScheduledProcedureStepLocation = ''
  ds.ScheduledProcedureStepSequence = [item]
  return ds

def handleResponse(response, sql):
  for (status, dataset) in response:
    if status:
      if status.Status in (0xFF00, 0xFF01):
        logger.info('I have a dataset')
    else:
      logger.error('Status Not availble')  
  


#Starting the service
if __name__ == "__main__":
  logger = logging.getLogger("pingLogger")
  logging.basicConfig(filename=config.loggingPath, level=logging.INFO)
  waiting = False #First iteration does not wait

  ae = pynetdicom.AE()
  ae.add_requested_context(ModalityWorklistInformationFind)

  while(True):
    if waiting:
      time.sleep(5) # Waiting comes first because of Continue statements
    waiting = True 

    with MysqlCursor() as sql:
      if sql:
        conP = getConnectionParameters(sql)
        ds   = getQueryDataset(sql)
        with MyDicomConnection(ae,conP['ip'],conP['port'],conP['aet']) as assoc: 
          if assoc:
            response = assoc.send_c_find(ds, ModalityWorklistInformationFind)
            handleResponse(response, sql)
          else:
            continue
      else:
        continue

    logger.info("This happens")
    
  
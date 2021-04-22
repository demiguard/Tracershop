#
# See README.MD for 
#
# Author: Christoffer Vilstrup Jensen
#

import logging
import time as systime
import traceback

from datetime import datetime, date, time, timedelta
from logging.handlers import SysLogHandler
#Custompackages 
import pingServiceConfig as config
#Pip packages
import pydicom
import pynetdicom
from pydicom import Dataset
from pynetdicom.sop_class import ModalityWorklistInformationFind

#Mysql
import mysql.connector as mysql
from mysql.connector import errorcode

#Mysql cursor because they couldn't be bothered to implement it in the mysql lib
# Note these objects are much smarter because they do some Entering / error handling

class MysqlCursor(object):
  def __init__(self):
    pass
  def __enter__(self):
    try:
      self.connection = mysql.connect(**config.DBConfig)
      self.connected = True
      logger.debug("Successfully connected to The Database")
      return self.connection.cursor()
    except mysql.Error as Err:
      logger.error(f"Failed to connect to the Database because {Err}")
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

# Helper Functions Primairy SQL functions
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

def getProcedureID(sql, ProcedureName) -> int:

  sqlQuery = f""" 
    SELECT 
      ID 
    FROM
      customer_procedure
    WHERE
      title=\"{ProcedureName}\"
  """
  sql.execute(sqlQuery)
  x = sql.fetchone()
  if x==None:
    return -1
  else:
    return x[0]

def getLocation(sql, location:str) -> str:
  sqlQuery = f""" 
    SELECT 
      location 
    FROM
      customer_location
    WHERE
      location=\"{location}\";
  """
  sql.execute(sqlQuery)
  x = sql.fetchone()
  if x==None:
    return ''
  else:
    return x[0]


def AddLocation(sql, LocationName):
  SQLQuery = f"""
  INSERT INTO customer_location(
    location,
    LocName,
    AssignedTo_id
  ) VALUES (
    \"{LocationName}\",
    \"\"
    NULL
  )
  """
  sql.execute(SQLQuery)
  logger.info(f"Added Location{LocationName}")



def AddProcedure(sql, procedureName):
  logger.info(f"Added producedure:{procedureName}")
  SQLQuery = f"""
  INSERT INTO customer_procedure(
    title,
    baseDosis,
    delay,
    inUse,
    tracer_id
  ) Values (
    \"{procedureName}\",
    0,
    0,
    0,
    NULL
  )
  """
  sql.execute(SQLQuery)

def getOldBookings(sql):
  SQLQuery = f"""
  SELECT 
    accessionNumber
  FROM
   customer_booking
  """
  sql.execute(SQLQuery)
  unformatedAcc =  sql.fetchall()
  unformatedAcc = [x[0] for x in unformatedAcc]
  return set(unformatedAcc)

def updateTimeStamp(sql):
  now = datetime.now()

  sqlQuery = f"""
    REPLACE INTO customer_updatetimestamp(id, timeStamp) Values (1, \"{now.strftime("%Y-%m-%d %H:%M:%S")}\")
  """
  sql.execute(sqlQuery)


def deleteOldbookings(sql, accessionNumbers):
  accessionNumbers = list(map(lambda x: f"\"{x}\"", accessionNumbers))
  accessionNumbers = ", ".join(accessionNumbers)

  SQLQuery = f"""
  DELETE FROM customer_booking 
  WHERE accessionNumber IN ({accessionNumbers})"""
  sql.execute(SQLQuery)

def insertIntoDatabase(sql, accessionNumbers, BookingInfo):
  for accessionNumber in accessionNumbers:
    bookingData = BookingInfo[accessionNumber]
    storeDataset(
      sql,
      BookingData['accessionNumber'], 
      BookingData['startDate'], 
      BookingData['startTime'], 
      BookingData['location'], 
      BookingData['procedure_id']
      )


def storeDataset(sql, accessionNumber, startDate, startTime, location, procedure_id):
  sqlQuery = f"""
    Insert INTO customer_booking(
      accessionNumber,
      startDate,
      startTime,
      location_id,
      procedure_id
    ) VALUES (
      \"{accessionNumber}\",
      \"{startDate}\",
      \"{startTime}\",
      \"{location}\",
      {procedure_id}
    )
  """
  sql.execute(sqlQuery)


#######################################################
#                                                     #
# -------------- Handler functions ------------------ #
#                                                     #
#######################################################
def handleDataset(dataset, sql):
  seq = dataset.ScheduledProcedureStepSequence[0]
  location = getLocation(sql, str(seq.ScheduledProcedureStepLocation))
  if not(location):
    logger.error(f"Unknown Location: {seq.ScheduledProcedureStepLocation}")
    AddLocation()
    return handleDataset(dataset,sql)
  procedure_id = getProcedureID(sql, seq.ScheduledProcedureStepDescription)
  if procedure_id == -1:
    logger.error(f"Unknown Procedure: {seq.ScheduledProcedureStepDescription}")
    AddProcedure(sql, seq.ScheduledProcedureStepDescription)
    return handleDataset(dataset,sql)
  accessionNumber = seq.ScheduledProcedureStepID
  unformattedTime = seq.ScheduledProcedureStepStartTime
  unformattedDate = seq.ScheduledProcedureStepStartDate
  startTime = unformattedTime[:2] + ":" + unformattedTime[2:4] + ":" + unformattedTime[4:]
  startDate = unformattedDate[:4] + "-" + unformattedDate[4:6] + "-" + unformattedDate[6:]
  #storeDataset(sql, accessionNumber, startDate, startTime, location, procedure_id)
  return accessionNumber, {
    "AccessionNumber" : accessionNumber,
    "Location"        : location,
    "startDate"       : startDate,
    "startTime"       : startTime,
    "procedure_id"    : procedure_id

  }

# C-Find Response
def handleResponse(response, sql):
  # Idea
  # Do a C-find
  # Accumulate data from C-FIND
  # Create Set A over Accession Numbers from C-Find 
  # Query Own Data base and make set B
  # Remove B \ A 
  # Add    A \ B
  
  accessionNumbers = set()
  BookingInfo = {}
  for (status, dataset) in response:
    if status:
      if status.Status in (0xFF00, 0xFF01):
        accessionNumber, Data = handleDataset(dataset,sql)
        BookingInfo[accessionNumber] = Data
        accessionNumbers.add(accessionNumber)
    else:
      logger.error('Status Not availble') 
      return

  logger.debug("Handled C-Find")

  oldBookings = getOldBookings(sql)
  logger.debug("Aquired Old bookings")
  toBeRemoved = oldBookings - accessionNumbers
  toBeAdded   = accessionNumbers - oldBookings
  logger.debug("Finished Intersections")

  if len(toBeRemoved) > 0:
    logger.info(f"Deleted {len(toBeRemoved)} Studies")
    deleteOldbookings(sql, toBeRemoved)  
  if len(toBeAdded) > 0:
    logger.info(f"Added {len(toBeAdded)} Studies")
    addBookings(sql, toBeAdded, BookingInfo)

  logger.debug("Finished Handling Response")
   
  
##################################################
#                                                #
# ------------ Starting the service ------------ #
#                                                #
##################################################

if __name__ == "__main__":

  logging.basicConfig(format="%(levelname)s - %(asctime)s :%(message)s", filename=config.loggingPath, level=logging.INFO)
  nosyLogger =  logging.getLogger('pynetdicom')
  nosyLogger.setLevel(logging.ERROR)
  
  logger = logging.getLogger("pingLogger")
  

  waiting = False #First iteration does not wait

  ae = pynetdicom.AE()
  ae.add_requested_context(ModalityWorklistInformationFind)

  while(True):
    if waiting:
      systime.sleep(900) # Waiting comes first because of Continue statements
    waiting = True 
    logger.debug("started Updating Database")
    with MysqlCursor() as sql:
      if sql:
        updateTimeStamp(sql)
        conP = getConnectionParameters(sql)
        ds   = getQueryDataset(sql)
        with MyDicomConnection(ae,conP['ip'],conP['port'],conP['aet']) as assoc: 
          if assoc:
            response = assoc.send_c_find(ds, ModalityWorklistInformationFind)
            handleResponse(response, sql)
            logger.debug("Finished Updating Database")
          else:
            logger.error("Could Not connect to Ris")
            continue
      else:
        logger.error("Could not Create connection to Database")
        continue
    
  
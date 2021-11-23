from django.db import connection
from django.core.exceptions import ObjectDoesNotExist

from typing import Type, Dict, List
from datetime import datetime, time, date

from api.models import ServerConfiguration

from lib.SQL import SQLFormatter, SQLExecuter, SQLFactory, SQLLegacyController



"""
This class contains all the database calls to the database.
Note that a large part of this is just calls to the Legacy controller. 
This is because one should be able to exchange that, module if the underlying database changes.

"""


def getCustomers():
  """
    Retrieves entries from the external customer table, where the user is an customer and not an admin / production 
    
    Returns List of Dict on this structure:
    {
      UserName : str (login name)
      ID : Int (Unique)
      overhead : int (Assume this is a procentage)
      CustomerNumber : Int (Unique, but there's no constraint)
      Name : Str ( Real name so petrh = Rigshospitalet)
    }
  """
  return SQLLegacyController.getCustomers()

def getTracers():
  return SQLLegacyController.getTracers()

def getIsotopes():
  return SQLLegacyController.getIsotopes()

def getCustomer(ID):
  return SQLLegacyController.getCustomer(ID)

def getCustomerDeliverTimes(ID):
  return SQLLegacyController.getCustomerDeliverTimes(ID)

def getTorderMonthlyStatus(year : int, month : int):
  return SQLLegacyController.getTorderMonthlyStatus(year, month)

def getOrderMonthlyStatus(year : int, month : int):
  return SQLLegacyController.getOrderMonthlyStatus(year, month)

def getActivityOrders(requestDate, tracerID):
  return SQLLegacyController.getActivityOrders(requestDate, tracerID)

def setFDGOrderStatusTo2(oid:int):
  SQLLegacyController.setFDGOrderStatusTo2(oid)

def getRuns():
  return SQLLegacyController.getRuns()

def getProductions():
  return SQLLegacyController.getProductions()

def UpdateOrder(Order : Dict):
  SQLLegacyController.UpdateOrder(Order)

def getTOrders(requestDate: date): 
  return SQLLegacyController.getTOrders(requestDate)

def setTOrderStatus(oid, status):
  SQLLegacyController.setTOrderStatus(oid, status)

def updateTracer(tracerID, key, newValue):
  SQLLegacyController.updateTracer(tracerID, key, newValue)

def getTracerCustomerMapping():
  return SQLLegacyController.getTracerCustomer()

def createTracerCustomer(tracer_id, customer_id):
  SQLLegacyController.createTracerCustomer(tracer_id, customer_id)

def deleteTracerCustomer(tracer_id, customer_id):
  SQLLegacyController.deleteTracerCustomer(tracer_id, customer_id)

def createNewTracer(Name, isotope, n_injections, order_block):
  SQLLegacyController.createNewTracer(Name, isotope, n_injections, order_block)
  return SQLLegacyController.getTracers()

def deleteTracer(tracer_id):
  SQLLegacyController.deleteTracer(tracer_id)

def createDeliverTime(run, MaxFDG, dtime, repeat, day, customer):
  """
    Creates a new deliverTime with the given input, returns the ID of the new DeliverTimes
  """
  return SQLLegacyController.createDeliverTime(
      run, MaxFDG, dtime, repeat, day, customer
  )

def deleteDeliverTime(DTID):
  SQLLegacyController.deleteDeliverTime(DTID)

def updateDeliverTime(MaxFDG, run, dtime, repeat, day, DTID):
  SQLLegacyController.updateDeliverTime(MaxFDG, run, dtime, repeat, day, DTID)

def getClosedDays() -> List[Dict]:
  return SQLLegacyController.getClosedDays()

def deleteCloseDay(requestDate : date) -> None:
  SQLLegacyController.deleteCloseDay(requestDate)

def createCloseDay(requestDate : date) -> None:
  SQLLegacyController.createCloseDay(requestDate)

def getServerConfig() -> ServerConfiguration:
  """
    This Functions retrives the serverConfig model from theserver, if it doesn't exists it creates a default object.
  """
  try:
    ServerConfig = ServerConfiguration.objects.get(ID=1)
  except ObjectDoesNotExist:
    Databases    = Database.objects.all()
    ServerConfig = ServerConfiguration(ID=1, ExternalDatabase=Databases[0])
    ServerConfig.save()

  return ServerConfig

def createEmptyFDGOrder(CustomerID, deliverTimeStr, run, comment):
  SQLLegacyController.insertEmptyFDGOrder(CustomerID, deliverTimeStr, run, comment)

  return SQLLegacyController.getFDGOrder(BID=CustomerID, deliver_datetime=deliverTimeStr, run=run)


def getVial(
    CustomerID = 0,
    Charge = "",
    FillDate ="",
    FillTime = "",
    Volume = 0.0, 
    activity = 0,
    ID = 0
  ) -> Dict:
  return SQLLegacyController.getVial(CustomerID, Charge, FillDate, FillTime, Volume, activity, ID)

def getVials(request_date : date) -> [Dict]:
  return SQLLegacyController.getVials(request_date)

def createVial(CustomerID, Charge, FillDate, FillTime, Volume, activity): 
  SQLLegacyController.createVial(CustomerID, Charge, FillDate, FillTime, Volume, activity)

def updateVial(
    ID,
    CustomerID=0, 
    Charge="",
    FillDate="",
    FillTime="",
    Volume=0,
    activity=0
  ):
  SQLLegacyController.updateVial(
      ID,
      CustomerID = CustomerID, 
      Charge = Charge,
      FillDate = FillDate,
      FillTime = FillTime,
      Volume = Volume,
      activity = activity
    )

def getVialRange(startdate : date, endDate : date):
  """
    Get all Vials in a date range
  
    Args:
      startDate : datetime.date - start date for the range
      endDate   : datetime.date - end date for the range
    returns a list of Dict with objects:
    [{
      customer  : int - customer number not id, that this vial belongs to
      charge    : str - batchnumber
      filldate  : date-str - date then vial was filled
      filltime  : time-str - time where vial was filled
      volume    : decimal(2) - Volume of radioactive Matieral
      ID        : int - id of Vial
      activity  : decimal(2) - Radioactive material in Vial
    }, ...]
  """
  return SQLLegacyController.getVialRange(startdate, endDate)

def FreeOrder(OrderID: int , Vial: Dict)-> Dict:
  SQLLegacyController.FreeOrder(OrderID, Vial)

def CreateNewFreeOrder(Vial : Dict) -> Dict:
  pass
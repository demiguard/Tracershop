"""
  This class is support to contain all the functions, 
  that makes SQL calls to the database. This is in an attempt to clean up the Consumer
  as it will get bloated with code otherwise.

  Most of this code is simply just an way to put the decorator on top. 
  Really there shouldn't be too much code down here, however it'll save you a few hundred lines in Real consumer
"""

__author__ = "Christoffer Vilstrup Jensen"


from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from api.models import ServerConfiguration, Database, Address
from lib.decorators import typeCheckfunc
from lib.SQL.SQLController import SQL
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, EmployeeDataClass, InjectionOrderDataClass, IsotopeDataClass, RunsDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass
from lib import pdfs


from datetime import datetime, date, timedelta
from typing import Dict, List, Tuple


class SQLConsumer(AsyncJsonWebsocketConsumer):
  def __init__(self, SQL_Controller=SQL()):
    super().__init__()
    self.SQL = SQL_Controller

  #Database handlers
  @database_sync_to_async
  def updatedOrder(
      self,
      order: ActivityOrderDataClass
    ) -> ActivityOrderDataClass:
    """[summary]

    Args:
        order (ActivityOrderDataClass): [description]

    Returns:
        ActivityOrderDataClass: [description]
    """
    self.SQL.updateOrder(order)

  @database_sync_to_async
  def CreateVial(self, Vial : VialDataClass) -> None:
    self.SQL.createVial(Vial)

  @database_sync_to_async
  def getVial(self, Vial : VialDataClass) -> VialDataClass:
    """
      This takes an incomplete VialDataClass and fills the data in it

      Args:
        Vial - VialDataClass - the incomplete VialDataClass
      return
        VialDataClass - a new VialDataClass with more fields,
                        if the field was precent in the old vial
                        it's the same in the new
    """
    return self.SQL.getVial(Vial)

  @database_sync_to_async
  def getServerConfiguration(self) -> ServerConfiguration:
    """Get the server configuration

    Returns:
        ServerConfiguration: the server configuration Instance
    """
    return self.SQL.getServerConfig()

  @database_sync_to_async
  def assignVial(self,
      Order : ActivityOrderDataClass,
      Vial : VialDataClass
    ) -> List[ActivityOrderDataClass]:
    """Fills an order with data from the vialID given

      Args:
        Order  : ActivityOrderDataClass, is the order the vial is being assigned to
        VialID : VialDataClass, corosponding to the vial that is being assigned

      Returns:
        List[ActivityOrderDataClass] : List of modified orders
    """
    #Order Changes:
    Order.frigivet_datetime = datetime.now()
    Order.frigivet_amount   = Vial.activity
    Order.frigivet_af = self.user.OldTracerBaseID
    Order.volume = Vial.volume
    Order.batchnr = Vial.charge

    #Vial Changes
    Vial.OrderMap = Order.oid

    return self.SQL.FreeOrder(Order, Vial, self.user)

  @database_sync_to_async
  @typeCheckfunc
  def createVialOrder(
      self,
      Vial: VialDataClass,
      OriginalOrder: ActivityOrderDataClass,
      tracerID : int
    ) -> ActivityOrderDataClass:
    """
      Creates an "empty" Order to indicate that an order was assigned multiple Vials

      returns
        ActivityOrderClass: The order created
    """
    return self.SQL.CreateNewFreeOrder(OriginalOrder, Vial, tracerID, self.user)

  @database_sync_to_async
  def createPDF(
    self,
    Order: ActivityOrderDataClass,
    Vials: List[VialDataClass]
  ):
    customer = self.SQL.getCustomer(Order.BID)
    Tracer, Isotope = self.SQL.getTracerAndIsotope(Order.tracer)
    pdfPath = pdfs.getPdfFilePath(customer, Order)
    pdfs.DrawSimpleActivityOrder(pdfPath, customer, Order, Vials, Tracer, Isotope)
    return pdfPath

  @database_sync_to_async
  @typeCheckfunc
  def createOrder(
    self,
    deliver_datetime : datetime,
    Customer : CustomerDataClass,
    amount : float,
    amount_overhead : float,
    tracer : TracerDataClass,
    run : int
  ):
    return self.SQL.productionCreateOrder(
      deliver_datetime,
      Customer,
      amount,
      amount_overhead,
      tracer,
      run,
      self.user.username
    )

  @database_sync_to_async
  def getGreatState(self) -> Tuple[
      List[EmployeeDataClass],
      List[CustomerDataClass],
      List[DeliverTimeDataClass],
      List[IsotopeDataClass],
      List[VialDataClass],
      List[RunsDataClass],
      List[ActivityOrderDataClass],
      List[InjectionOrderDataClass],
      ServerConfiguration,
      List[Database],
      List[Address]]:

    """This function is responsible for gathering the state of the database.

      Returns:
        Tuple[List[],]
    """
    SC = self.SQL.getServerConfig()
    databases = self.SQL.getModels(Database)
    addresses = self.SQL.getModels(Address)

    dateRange = SC.DateRange # Move this to serverconfiguration


    today = datetime.now()
    startDate = today - timedelta(days=dateRange)
    endDate = today + timedelta(days=dateRange)

    Employees = self.SQL.getEmployees() # Not a legacy db concept
    Customers = self.SQL.getDataClass(CustomerDataClass)
    DeliTimes = self.SQL.getDataClass(DeliverTimeDataClass)
    Isotopes  = self.SQL.getDataClass(IsotopeDataClass)
    Runs      = self.SQL.getDataClass(RunsDataClass)
    Tracers   = self.SQL.getDataClass(TracerDataClass)
    Orders    = self.SQL.getDataClassRange(startDate, endDate, ActivityOrderDataClass)
    Vials     = self.SQL.getDataClassRange(startDate, endDate, VialDataClass)
    T_Orders  = self.SQL.getDataClassRange(startDate, endDate, InjectionOrderDataClass)



    return (Employees, Customers, DeliTimes, Isotopes, Vials, Runs, Orders, T_Orders, Tracers, SC, list(databases), list(addresses))

  @database_sync_to_async
  @typeCheckfunc
  def createGhostOrder(self,
      deliver_datetime : datetime,
      Customer : CustomerDataClass,
      amount_total : float,
      amount_total_overhead : float,
      tracer : TracerDataClass,
      run : int,
      username : str
    ) -> ActivityOrderDataClass:
    return self.SQL.createGhostOrder(deliver_datetime, Customer, amount_total, amount_total_overhead, tracer, run, username)

  @database_sync_to_async
  def getServerConfig(self):
    return self.SQL.getServerConfig()

  @database_sync_to_async
  def getElement(self, ID: int, Dataclass):
    return self.SQL.getElement(ID, Dataclass)

  @database_sync_to_async
  def updateDataClass(self, dataClass : JsonSerilizableDataClass):
    self.SQL.UpdateJsonDataClass(dataClass)

  @database_sync_to_async
  def getDataClass(self, dataClass):
    return self.SQL.getDataClass(dataClass)

  @database_sync_to_async
  def getDataClassRange(self, startDate, endDate, DataClass):
    return self.SQL.getDataClassRange(startDate, endDate, DataClass)

  @database_sync_to_async
  @typeCheckfunc
  def deleteActivityOrders(
    self,
    oids_to_delete : List[int]
  ):
    self.SQL.deleteActivityOrders(oids_to_delete)


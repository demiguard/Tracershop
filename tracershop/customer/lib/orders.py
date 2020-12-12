import math

from datetime import datetime, date, time, timedelta

from customer.lib import calenderHelper
from customer.lib import Formatting
from customer.lib.SQL import SQLController as SQL 
from customer.models import Procedure, Booking, Tracer

def calculateDosisFDG(booking, userID, times):
  if not(startDate := booking.startDate):
    #Perhaps Raise an error here
    return 0, None
  if not(startTime := booking.startTime):
    #Also Error here
    return 0, None
  if (procedure := booking.procedure) == None:
    return 0, None 
  if (delay := procedure.delay) == None:
    return 0, None
  if (baseDosis := procedure.baseDosis) == None:
    return 0, None
  if (halfLife := procedure.tracer.isotope.halfTime) == None:
    return 0, None
  
  startdatetime = calenderHelper.combine_time_and_date(startDate, startTime)
  injectionTime = startdatetime + timedelta(minutes=delay)
  times = reversed(times)

  for time in times:
    if injectionTime > time:
      timeDelta = (injectionTime - time).total_seconds() #Int not datetime.timedelta object!
      dose = baseDosis*math.exp((math.log(2) / halfLife)*timeDelta)
      return dose, time

  return 0, None

def insertTOrderBooking(booking, customerID : int ):
  bookingDatetime = calenderHelper.combine_time_and_date(booking.startDate, booking.startTime)
  SQLController.insertTOrder(1, bookingDatetime, booking.procedure.tracer.ID, "human", customerID)

def MergeMonthlyOrders(year: int, month: int, FDG: dict, TOrders: dict):
  #### So goal is to merge the two dict into one                                        ####
  #### Function needs to map 1,2,3 from each dict                                       ####
  #### Uses first digit is status from first dict and second dict is status from second ####
  month = Formatting.convertIntToStrLen2(month)
  returnDict = {}

  for i in range(1,32):
    status = 0
    dayStr = Formatting.convertIntToStrLen2(i)
    dateStr = f"{year}-{month}-{dayStr}"
    if FDGStatus := FDG.get(dateStr):
      status += FDGStatus
    if TOrderStatus := TOrders.get(dateStr):
      status += 10 * TOrderStatus
    returnDict[dateStr] = status

  return returnDict

def getMonthlyOrders(year, month, userID):
  MonthlyStatusFDG     = SQL.queryOrderByMonth(year, month, userID)
  MonthlyStatusTOrders = SQL.queryTOrderByMonth(year, month, userID)
  return                 MergeMonthlyOrders(year, month, MonthlyStatusFDG, MonthlyStatusTOrders) 

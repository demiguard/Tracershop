import math

from datetime import datetime, date, time, timedelta

from customer.lib import calenderHelper
from customer.lib import Formatting
from customer import constants
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

def insertTOrderBooking(booking, customerID : int , username):
  bookingDatetime = calenderHelper.combine_time_and_date(booking.startDate, booking.startTime)
  SQLController.insertTOrder(1, bookingDatetime, booking.procedure.tracer.ID, "human", customerID, username)

def MergeMonthlyOrders(year: int, month: int, FDG: dict, TOrders: dict):
  #### So goal is to merge the two dict into one                                        ####
  #### Function needs to map 1,2,3 from each dict                                       ####
  #### Uses first digit is status from first dict and second dict is status from second ####
  monthStr = Formatting.convertIntToStrLen2(month)
  returnDict = {}

  closedDates = SQL.monthlyCloseDates(year, month)

  for i in range(1,32):
    try:
      calenderDate = date(year,month,i)
    except ValueError:
      continue
    status = 0
    dayStr = Formatting.convertIntToStrLen2(i)
    dateStr = f"{year}-{monthStr}-{dayStr}"
    if FDGStatus := FDG.get(dateStr):
      status += FDGStatus
    else:  
      if not(isOrderFDGAvailalbeForDate(calenderDate, closedDates)):
        status += 5
    if TOrderStatus := TOrders.get(dateStr):
      status += 10 * TOrderStatus
    else:
      if not(isOrderTAvailableForDate(calenderDate, closedDates)):
        status += 50
      
    
    returnDict[dateStr] = status

  return returnDict

def getMonthlyOrders(year, month, userID):
  MonthlyStatusFDG     = SQL.queryOrderByMonth(year, month, userID)
  MonthlyStatusTOrders = SQL.queryTOrderByMonth(year, month, userID)
  mergedOrders         = MergeMonthlyOrders(year, month, MonthlyStatusFDG, MonthlyStatusTOrders) 
  
  return mergedOrders


def isOrderFDGAvailalbeForDate(date, closedDates):
  now = datetime.now()

  deadlineDateTime = datetime(date.year, date.month, date.day, constants.ORDERDEADLINEHOUR, constants.ORDERDEADLINEMIN) + timedelta(days=constants.ORDERDEADLINEDAY)

  if deadlineDateTime < now:
    return False

  if closedDates.get(date.strftime("%Y-%m-%d")):
    return False
  return True


def isOrderTAvailableForDate(date, closedDates):
  now = datetime.now()

  nextDeadlineday  = now + timedelta(days=(constants.TORDERDEADLINEWEEKDAY - now.weekday()) % 7)
  deadlineDateTime = datetime(nextDeadlineday.year, nextDeadlineday.month, nextDeadlineday.day, constants.TORDERDEADLINEHOUR, constants.TORDERDEADLINEMIN)
  if now.weekday() == constants.TORDERDEADLINEWEEKDAY:
    nowDT = datetime(date.year, date.month, date.day, now.hour, now.minute)
  else:
    nowDT = datetime(date.year, date.month, date.day, 0, 0)
  if nowDT < deadlineDateTime :
    return False

  if closedDates.get(date.strftime("%Y-%m-%d")):
    return False

  return True

def removeOrdersFromList(responses):
  returnlist = []
  for response in responses:
    if response['data_type'] != "form":
      returnlist.append(response)
  return returnlist
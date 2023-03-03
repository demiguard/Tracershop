import math

from datetime import datetime, date, time, timedelta

from typing import List, Dict

from logging import getLogger

from customer.lib import calenderHelper
from customer.lib import Formatting
from customer import constants
from customer.lib.SQL import SQLController as SQL
from customer.models import Procedure, Booking, Tracer

logger = getLogger('TracershopLogger')

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

  start_datetime = calenderHelper.combine_time_and_date(startDate, startTime)
  injectionTime = start_datetime + timedelta(minutes=delay)
  times = reversed(times)

  for time in times:
    if injectionTime > time:
      timeDelta = (injectionTime - time).total_seconds() #Int not datetime.timedelta object!
      dose = baseDosis*math.exp((math.log(2) / halfLife)*timeDelta)
      return dose, time

  return 0, None

def calculateDosisForTime(booking: Booking, productionTime : datetime):
  """This function calculates the amount of activity that needs to Ordered at Production time

  Args:
      booking (Booking): The booking being ordered for
      productionTime (datetime): This is requested time slot

  Raises:
      ValueError: If the production time is after booking starttime, the production can't deliver hence error.

  Returns:
      float: Amount of MBq that needs to be ordered
  """
  start_datetime = calenderHelper.combine_time_and_date(booking.startDate, booking.startTime)
  injectionTime = start_datetime + timedelta(minutes=booking.procedure.delay)

  if injectionTime > productionTime:
    baseDosis = booking.procedure.baseDosis
    if baseDosis is None:
      logger.error("Base Dosis is None!")
      baseDosis = 0

    tracer = booking.procedure.tracer
    if tracer is None:
      logger.error(f"Procedure: {booking.procedure} does not have a Tracer associated with it")
      halflife = 1
    elif tracer.isotope is None:
      logger.error(f"Tracer: {tracer} does not have a isotope associated with it")
      halflife = 1
    elif tracer.isotope.halfTime is None:
      logger.error(f"Isotope: {tracer.isotope} doesn't have a halflife")
      halflife = 1
    else:
      halflife = tracer.isotope.halfTime

    timeDelta = (injectionTime - productionTime).total_seconds()
    return baseDosis * math.exp((math.log(2) / halflife)*timeDelta)
  else:
    raise ValueError("Cannot Deliver injection order after it has been ordered")


def insertTOrderBooking(booking : Booking, customerID : int , username):

  bookingDatetime = calenderHelper.combine_time_and_date(booking.startDate, booking.startTime)
  bookingDatetime += timedelta(minutes=booking.procedure.delay)

  SQL.insertTOrder(1, bookingDatetime, booking.procedure.tracer.ID, "Human", customerID, username, f"Automaticly Generated {booking.procedure.tracer.tracerName} Order")

def MergeMonthlyOrders(year: int, month: int, FDG: dict, TOrders: dict, userID: int):
  #### So goal is to merge the two dict into one                                        ####
  #### Function needs to map 1,2,3 from each dict                                       ####
  #### Uses first digit is status from first dict and second dict is status from second ####
  monthStr = Formatting.convertIntToStrLen2(month)
  returnDict = {}
  openDays = SQL.getOpenDays(userID)
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
      if not(isOrderFDGAvailableForDate(calenderDate, closedDates, openDays)):
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
  mergedOrders         = MergeMonthlyOrders(year, month, MonthlyStatusFDG, MonthlyStatusTOrders, userID) 

  return mergedOrders


def isOrderFDGAvailableForDate(date: date, closedDates, openDays: List[int]) -> bool:
  """
    This function check if you place a FDG order to the specified date right now

    Args:
      date: Date - The Date in questing
      closedDates - Set[str]
      openDays - List[int] - list of days tracershop is open

    Returns:
      bool: if allowed or not
  """
  now = datetime.now()

  if closedDates.get(date.strftime("%Y-%m-%d")):
    logger.info("Denied, Closed day")
    return False


  if date.weekday() not in openDays:
    logger.info("Denied, not an open day")
    return False

  # This is an old piece of code for where mondays must be ordered on the friday
  #deadlineWeekDate = (date.weekday() - 1) % 5
  #deadlineDateTime = datetime(date.year, date.month, date.day, constants.ORDERDEADLINEHOUR, constants.ORDERDEADLINEMIN)
  #while deadlineDateTime.weekday() != deadlineWeekDate:
  #  deadlineDateTime -= timedelta(days=1)


  # I wanna put a small comment here why it's plus a timedelta and not just date.day + 1
  # Consider the date 2011-01-31, correct day here would be 2011-02-01 not 2011-01-32
  # Hence this is why
  deadlineDateTime = datetime(
    date.year,
    date.month,
    date.day,
    constants.ORDERDEADLINEHOUR,
    constants.ORDERDEADLINEMIN
  ) + timedelta(days=1)

  if deadlineDateTime < now:
    logger.info(f"Denied, Deadline for {date} passed is {deadlineDateTime}")
    return False

  logger.info("Accepted")
  return True


def isOrderTAvailableForDate(date, closedDates, now= datetime.now()) -> bool:
  nextDeadlineDay  = now + timedelta(days=(constants.TORDERDEADLINEWEEKDAY - now.weekday()) % 7)
  deadlineDateTime = datetime(nextDeadlineDay.year, nextDeadlineDay.month, nextDeadlineDay.day, constants.TORDERDEADLINEHOUR, constants.TORDERDEADLINEMIN)
  if now.weekday() == constants.TORDERDEADLINEWEEKDAY:
    nowDT = datetime(date.year, date.month, date.day, now.hour, now.minute)
  else:
    nowDT = datetime(date.year, date.month, date.day, 0, 0)

  if nowDT < deadlineDateTime:
    logger.info(f"Denied, Deadline for {date} passed is {deadlineDateTime}")
    return False

  if closedDates.get(date.strftime("%Y-%m-%d")):
    logger.info("Denied, Closed day")
    return False

  logger.info("Accepted")
  return True

def removeOrdersFromList(responses):
  return_list = []
  for response in responses:
    if response['data_type'] != "form":
      return_list.append(response)
  return return_list

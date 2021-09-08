import json

from datetime import date

def ParseJSONRequest(request):
  if request.body:
    return json.load(request)
  else:
    return {}

def convertIntToStrLen2(INT : int) -> str:
  INT = str(INT)
  if len(INT) == 1:
    return "0" + INT
  return INT

def mergeMonthlyOrders(year :int, month : int, orders : dict, t_orders : dict) -> dict:
  monthStr = convertIntToStrLen2(month)
  returnDict = {}

  for i in range(1,32):
    try:
      calenderDate = date(year,month,i)
    except ValueError:
      continue
    status = 0
    if FDGStatus := orders.get(calenderDate):
      status += FDGStatus
    else:  
      status += 5
    if TOrderStatus := t_orders.get(calenderDate):
      status += 10 * TOrderStatus
    else:
      status += 50
    
    returnDict[calenderDate] = status

  return returnDict
  
def EncodeDateTimeDict(Dict : dict) -> dict:
  returnDict = {}
  for dt, val in Dict.items():
    returnDict[dt.__str__()] = val
  return returnDict

def FormatDateTimeJStoSQL(datetimestr : str) -> str:
  return datetimestr.replace("T", " ")

  
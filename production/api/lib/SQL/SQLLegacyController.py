"""
  The Idea behind this class to be the only link to the legacy database.
  In other word this class is an interface for communication between the 
  different Tracershop apps. 
"""
from datetime import timedelta, time


from api.lib.SQL import SQLExecuter, SQLFormatter

def getCustomers():
  SQLQuery = """
    SELECT 
      Users.Username, 
      Users.Id
    FROM 
      Users
      INNER JOIN UserRoles on
        Users.Id = UserRoles.Id_User
    WHERE
      UserRoles.Id_Role = 4
  """


  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  names = ["UserName", "ID"]
  return SQLFormatter.FormatSQLTuple(SQLResult, names)
  
def getCustomer(ID):
  SQLQuery = f"""
    SELECT 
      EMail,
      EMail2,
      EMail3, EMail4, overhead, kundenr, contact, tlf
    FROM
      Users
    Where
      Id={ID}
  """
  EMail1, EMail2, EMail3, EMail4, overhead, kundenr, contact, tlf  = SQLExecuter.ExecuteQueryFetchOne(SQLQuery)
  
  if EMail1 == None  : EMail1 = ""
  if EMail2 == None  : EMail2 = ""
  if EMail3 == None  : EMail3 = ""
  if EMail4 == None  : EMail4 = ""
  if contact == None : contact = ""
  if not tlf         :  
    tlf = ""   
  else:
    tlf = str(tlf)

  return {
    "EMail1" :   EMail1,
    "EMail2" :   EMail2,
    "EMail3" :   EMail3,
    "EMail4" :   EMail4,
    "overhead" : overhead,
    "kundenr" :  kundenr,
    "contact":   contact,
    "tlf": tlf
  }


def getCustomerDeliverTimes(ID):
  SQLQuery = f"""
    SELECT 
      deliverTimes.day,
      repeat_t,
      TIME_FORMAT(dtime, \"%T\"),
      max, 
      run, 
      DTID
    FROM
      Users
      INNER JOIN deliverTimes ON Users.ID=deliverTimes.BID
    Where
      Users.Id={ID}
    ORDER BY
      deliverTimes.day,
      deliverTimes.dtime
  """
  SQLResult = SQLExecuter.ExecuteQueryFetchAll(SQLQuery)

  result = {
    "days" : [],
    "repeat_t" : [],
    "dtime" : [],
    "max"   : [],
    "run" : [],
    "DTID" : []
  }

  for day, repeat_t, dtime, maxOrder, run, DTID in SQLResult:
    result["days"].append(day)
    result["repeat_t"].append(repeat_t)
    result["dtime"].append(dtime)
    result["max"].append(maxOrder)
    result["run"].append(run)
    result["DTID"].append(DTID)

  return result

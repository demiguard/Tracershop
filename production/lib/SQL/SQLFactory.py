"""
  This file contains all the SQL-queries executed by the SQL controller
  This is an extention file to the SQLController
"""
__author__ = "Christoffer Vilstrup Jensen"

from typing import Type, List, Union
from datetime import date,time,datetime
from dataclasses import fields

from lib.decorators import typeCheckfunc
from lib.SQL.SQLFormatter import SerilizeToSQLValue
from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, DeliverTimeDataClass, IsotopeDataClass, RunsDataClass, TracerDataClass, VialDataClass, JsonSerilizableDataClass
from lib.Formatting import dateConverter, mergeDateAndTime
from lib.utils import LMAP

from TracerAuth.models import User


def getCustomers(dataClass=CustomerDataClass) -> str:
  return f"""
    SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    WHERE
      {dataClass.getSQLWhere()}
  """

def getCustomer(ID: int) -> str:
  return f"""
    SELECT
      {CustomerDataClass.getSQLFields()}
    FROM
      {CustomerDataClass.getSQLTable()}
    Where
      Id={ID}
  """

def getElement(ID: int, dataClass) -> str:
  return f"""
    SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    Where
      {dataClass.getIDField()}={ID}
  """

def getDataClass(dataClass) -> str:
  # Note that in most cases where there's no internal filter then SQLWhere just returns TRUE ie: All elements of the class

  return  f"""
    SELECT
      {dataClass.getSQLFields()}
    FROM
      {dataClass.getSQLTable()}
    WHERE
      {dataClass.getSQLWhere()}
  """

def getCustomerDeliverTimes(ID : int) -> str:
  return f"""
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

def getTracers() -> str:
  return f"""
    SELECT
      {TracerDataClass.getSQLFields()}
    FROM
      {TracerDataClass.getSQLTable()}
  """

def getIsotopes() ->  str:
  return f"""
    SELECT
      {IsotopeDataClass.getSQLFields()}
    FROM
      {IsotopeDataClass.getSQLTable()}
  """

def getTracer(ID : int ) -> str:
  return f"""
    SELECT
      {TracerDataClass.getSQLFields()}
    FROM
      {TracerDataClass.getSQLTable()}
    WHERE
      id={SerilizeToSQLValue(ID)}
  """

def getIsotope(ID : int ) -> str:
  return f"""
    SELECT
      {IsotopeDataClass.getSQLFields()}
    FROM
      {IsotopeDataClass.getSQLTable()}
    WHERE
      id={SerilizeToSQLValue(ID)}
  """

def getActivityOrders(requestDate: date, tracerID: int) -> str:
  #Can't use SerilizeToSQLValue due to missing %
  return f"""
    SELECT
      {ActivityOrderDataClass.getSQLFields()}
    FROM
      orders
    WHERE
      deliver_datetime LIKE \"{dateConverter(requestDate)}%\" AND
      tracer={tracerID}
    ORDER BY
      BID,
      deliver_datetime
  """

def getRuns() -> str:
  return f"""
    SELECT
      {RunsDataClass.getSQLFields()}
    FROM
      {RunsDataClass.getSQLTable()}
    ORDER BY
      day, ptime
  """

def getDeliverTimes() -> str:
  return f"""
    SELECT
      {DeliverTimeDataClass.getSQLFields()}
    FROM
      {DeliverTimeDataClass.getSQLTable()}
    ORDER BY
      BID, day, dtime
  """

def updateOrder(Order : ActivityOrderDataClass) -> str:
  SQLQuery = """
    Update orders
    Set
  """
  Fields = fields(Order)
  for field in Fields:
    fieldVal =  Order.__getattribute__(field.name)
    if field.name == "oid" or not fieldVal:
      continue
    SQLQuery += f"{field.name}={SerilizeToSQLValue(fieldVal)},\n"
  SQLQuery = SQLQuery[:-2] + SQLQuery[-1] # Remove the last ','
  SQLQuery += f"""
    WHERE
      oid = {Order.oid}
  """
  return SQLQuery

def InsertVial(Vial: VialDataClass) -> str:
  return f"""
    INSERT INTO VAL(
      customer,
      charge,
      depotpos,
      filldate,
      filltime,
      volume,
      gros,
      tare,
      net,
      product,
      activity
    ) VALUES (
      {SerilizeToSQLValue(Vial.customer)},
      {SerilizeToSQLValue(Vial.charge)},
      0,
      {SerilizeToSQLValue(Vial.filldate)},
      {SerilizeToSQLValue(Vial.filltime)},
      {SerilizeToSQLValue(Vial.volume)},
      0,
      0,
      0,
      \"18F\",
      {SerilizeToSQLValue(Vial.activity)}
      )
  """

def getVial(Vial: VialDataClass) -> str:
  ValidConditions = []
  def helper(name, entry):
    if entry:
      ValidConditions.append((name, SerilizeToSQLValue(entry)))
  helper("VAL.customer", Vial.customer)
  helper("VAL.charge", Vial.charge)
  helper("VAL.filldate", Vial.filldate)
  helper("VAL.filltime", Vial.filltime)
  helper("VAL.volume", Vial.volume)
  helper("VAL.activity", Vial.activity)
  helper("VAL.ID", Vial.ID)
  Condition = ""
  for i, (FieldName, FieldValue) in enumerate(ValidConditions):
    if i == 0:
      Condition += f"{FieldName} = {FieldValue}"
    else:
      Condition += f" AND {FieldName} = {FieldValue}"
  return f"""
  SELECT
    VAL.customer,
    VAL.charge,
    VAL.filldate,
    TIME_FORMAT(VAL.filltime, \"%T\"),
    VAL.volume,
    VAL.activity,
    VAL.ID,
    VialMapping.Order_id
  FROM
    VAL
      LEFT JOIN VialMapping on VAL.ID = VialMapping.VAL_id
  WHERE
    {Condition}
  """

def getVials(requestDate : date) -> str:
  return f"""
  SELECT
    VAL.customer,
    VAL.charge,
    VAL.filldate,
    TIME_FORMAT(VAL.filltime, \"%T\"),
    VAL.volume,
    VAL.activity,
    VAL.ID,
    VialMapping.Order_id
  FROM
    VAL
      LEFT JOIN VialMapping on VAL.ID = VialMapping.VAL_id
  WHERE
    VAL.filldate = {SerilizeToSQLValue(requestDate)}
  """
def helper(name, entry, UpdateFields):
    if entry:
      UpdateFields.append((name, SerilizeToSQLValue(entry)))

def updateVial(Vial: VialDataClass) -> str:
  if Vial.ID == None:
    raise KeyError("No ID define for updating Vial")
  UpdateFields = []


  helper("customer", Vial.customer, UpdateFields)
  helper("charge",   Vial.charge,   UpdateFields)
  helper("filldate", Vial.filldate, UpdateFields)
  helper("filltime", Vial.filltime, UpdateFields)
  helper("volume",   Vial.volume,   UpdateFields)
  helper("activity", Vial.activity, UpdateFields)

  updateStr = ""

  for i, (field, value) in enumerate(UpdateFields):
    if i + 1 == len(UpdateFields):
      updateStr +=f"{field}={value}\n"
    else:
      updateStr +=f"{field}={value},\n"

  if not updateStr:
    raise ValueError("Vial Update String is Empty")

  return f"""
    UPDATE VAL
    SET
      {updateStr}
    WHERE
     ID={Vial.ID}
  """

def UpdateJsonDataClass(DataClassObject : JsonSerilizableDataClass) -> str:
  """Creates an string with a SQL Query for Updating an JsonSerilizableDataClass
     so that's matching to the input object.

  Args:
      DataClassObject (JsonSerilizableDataClass): _description_
  Returns:
      string with a SQL Query for Updating an JsonSerilizableDataClass
  """
  ID = getattr(DataClassObject, DataClassObject.getIDField())
  if ID == None:
    raise KeyError("No Valid ID for object, It should prob be created.")


  updateFields = []

  for field in DataClassObject.getFields():
    if field.name == DataClassObject.getIDField():
      continue
    FieldValue = getattr(DataClassObject, field.name)
    if FieldValue == None:
      continue
    updateFields.append((field.name, SerilizeToSQLValue(FieldValue)))

  updateString = ""

  for i, (field, value) in enumerate(updateFields):
    if i + 1 == len(updateFields):
      updateString +=f"{field}={value}"
    else:
      updateString +=f"{field}={value},\n"



  IDstring = f"{DataClassObject.getIDField()}={ID}"

  returnstr = f"""
    UPDATE {DataClassObject.getSQLTable()}
    SET
      {updateString}
    WHERE
      {IDstring}
  """

  return returnstr


def authenticateUser(username: str, password: str) -> str:
  Query = f"""
    Select
      username,
      id
    FROM
      Users
    WHERE
      username={SerilizeToSQLValue(username)} AND
      password={SerilizeToSQLValue(password)}
  """

  return Query

def FreeExistingOrder(Order: ActivityOrderDataClass, Vial : VialDataClass, user : User) -> str:
  return f"""
  UPDATE orders
  SET
    status=3,
    frigivet_af={user.OldTracerBaseID},
    frigivet_amount={Vial.activity},
    frigivet_datetime={SerilizeToSQLValue(datetime.now())},
    volume={Vial.volume},
    batchnr={SerilizeToSQLValue(Vial.charge)}
  WHERE
    oid={Order.oid}
  """

def FreeDependantOrders(Order: ActivityOrderDataClass, user: User) -> str:
  return f"""
  UPDATE orders
  SET
    status=3,
    frigivet_af={user.OldTracerBaseID},
    frigivet_datetime={SerilizeToSQLValue(datetime.now())}
  WHERE
    COID={Order.oid}
  """

def CreateVialMapping(Order: ActivityOrderDataClass, Vial : VialDataClass)-> str:
  return f"""
    INSERT INTO VialMapping(
      Order_id,
      VAL_id
    ) Values ({Order.oid},{Vial.ID})
  """

def getRelatedOrders(Order: ActivityOrderDataClass) -> str:
  return f"""
    SELECT
      {Order.getSQLFields()}
    FROM
      orders
    WHERE
      oid={Order.oid} OR COID={Order.oid}
  """

def createLegacyFreeOrder(
    OriginalOrder : ActivityOrderDataClass,
    Vial : VialDataClass,
    tracerID:int,
    user : User) -> str:

  now = datetime.now()

  return f"""
    INSERT INTO orders(
      amount,
      amount_o,
      batchnr,
      BID,
      COID,
      comment,
      deliver_datetime,
      frigivet_datetime,
      run,
      status,
      total_amount,
      total_amount_o,
      tracer,
      userName,
      frigivet_amount,
      frigivet_af,
      volume
    ) VALUES (
      0,
      0,
      \"{Vial.charge}\",
      {OriginalOrder.BID},
      -1,
      {SerilizeToSQLValue(f"Extra Vial for Order: {OriginalOrder.oid}")},
      {SerilizeToSQLValue(OriginalOrder.deliver_datetime)},
      {SerilizeToSQLValue(now)},
      {OriginalOrder.run},
      3,
      0,
      0,
      {tracerID},
      NULL,
      {Vial.activity},
      {user.OldTracerBaseID},
      {Vial.volume}
    )
  """

def getLastOrder() -> str:
  return f"""
    SELECT
      {ActivityOrderDataClass.getSQLFields()}
    FROM
     {ActivityOrderDataClass.getSQLTable()}
    WHERE
      OID = (
        SELECT
          MAX(OID)
        FROM orders
      )
  """

def getVialRange(startDate:date , endDate : date, DataClass=VialDataClass) -> str:
  return f"""
    SELECT
      {DataClass.getSQLFields()}
    FROM
      {DataClass.getSQLTable()}
    WHERE
      VAL.filldate BETWEEN {SerilizeToSQLValue(startDate)} AND {SerilizeToSQLValue(endDate)}
  """

@typeCheckfunc
def productionCreateOrder(
  deliver_datetime,
  Customer : CustomerDataClass,
  amount : float,
  amount_o : float,
  tracer : TracerDataClass,
  run : int,
  username : str
):
  return f"""
    INSERT INTO orders(
      amount,
      amount_o,
      total_amount,
      total_amount_o,
      batchnr,
      BID,
      COID,
      comment,
      deliver_datetime,
      run,
      status,
      tracer,
      userName
      )
    VALUES (
      {SerilizeToSQLValue(amount)},
      {SerilizeToSQLValue(amount_o)},
      {SerilizeToSQLValue(amount)},
      {SerilizeToSQLValue(amount_o)},
      \"\",
      {SerilizeToSQLValue(Customer.ID)},
      -1,
      \"\",
      {SerilizeToSQLValue(deliver_datetime)},
      {SerilizeToSQLValue(run)},
      2,
      {SerilizeToSQLValue(tracer.id)},
      {SerilizeToSQLValue(username)}
    )
  """

@typeCheckfunc
def getDataClassRange(startDate: Union[datetime, date], endDate : Union[datetime, date], DataClass) -> str:
  return f"""
    SELECT
      {DataClass.getSQLFields()}
    FROM
      {DataClass.getSQLTable()}
    WHERE
      {DataClass.getSQLDateTime()} BETWEEN {SerilizeToSQLValue(startDate)} AND {SerilizeToSQLValue(endDate)}
  """

@typeCheckfunc
def createGhostOrder(
      deliver_datetime : datetime,
      Customer : CustomerDataClass,
      amount_total : float,
      amount_total_overhead : float,
      tracer : TracerDataClass,
      run : int,
      username : str
    ) -> str:
  return f"""
    INSERT INTO orders(
      amount,
      amount_o,
      total_amount,
      total_amount_o,
      batchnr,
      BID,
      COID,
      comment,
      deliver_datetime,
      run,
      status,
      tracer,
      userName
      )
    VALUES (
      0,0,
      {SerilizeToSQLValue(amount_total)},
      {SerilizeToSQLValue(amount_total_overhead)},
      \"\",
      {SerilizeToSQLValue(Customer.ID)},
      -1,
      \"\",
      {SerilizeToSQLValue(deliver_datetime)},
      {SerilizeToSQLValue(run)},
      2,
      {SerilizeToSQLValue(tracer.id)},
      {SerilizeToSQLValue(username)}
    )
  """

@typeCheckfunc
def deleteActivityOrder(
  oids_to_delete : List[int]
):
  ids = ", ".join(LMAP(str,oids_to_delete)) # types are callable
  return f"""
    DELETE FROM orders WHERE oid IN ({ids})
  """
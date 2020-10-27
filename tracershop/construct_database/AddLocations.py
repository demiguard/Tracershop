import mysql.connector as mysql
import pydicom
import pynetdicom
from pydicom import Dataset
from pynetdicom.sop_class import ModalityWorklistInformationFind
from datetime import datetime, timedelta

locations = []

#DB Connection info
DBConfig = {
  'user' : "tracershop",
  'password' : "tracer",
  'host' : "localhost",
  'port' : '3306',
  'database': "tracerstore",
  'raise_on_warnings': True,
  'autocommit':True,
}

#
AET = 'RHKFATBUK561'
ip = '10.143.10.158'
port =  3320

ae = pynetdicom.AE()
ae.add_requested_context(ModalityWorklistInformationFind)
ds = Dataset()
item = Dataset()
item.ScheduledStationAETitle = 'RHKFATBUK561'
item.ScheduledProcedureStepStartDate = datetime.strftime(datetime.today()+timedelta(days=1), '%Y%m%d')+'-'
item.ScheduledProcedureStepLocation = ''
ds.ScheduledProcedureStepSequence = [item]

assoc = ae.associate(ip,port, ae_title=AET)
response = assoc.send_c_find(ds, ModalityWorklistInformationFind)
for (status, dataset) in response:
  if dataset:
    if dataset.ScheduledProcedureStepSequence[0].ScheduledProcedureStepLocation not in locations:
      locations.append(dataset.ScheduledProcedureStepSequence[0].ScheduledProcedureStepLocation)

assoc.release()

conn = mysql.connect(**DBConfig)
cursor = conn.cursor()

for location in locations:
  cursor.execute(
    f"""
      REPLACE INTO customer_location(location) VALUES (\"{location}\")
    """
  )



conn.close()
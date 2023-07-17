#
# Does a find at the stuff below
#

import pydicom
import pynetdicom
from pydicom import Dataset
from pynetdicom.sop_class import ModalityWorklistInformationFind
from datetime import datetime, timedelta

import sys
import logging

root = logging.getLogger()
root.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stderr)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
root.addHandler(handler)


AET = 'RHKFATBUK561'
ip = '10.143.128.247'
port =  3320

ae = pynetdicom.AE("RHKFATBUK561")
ae.add_requested_context(ModalityWorklistInformationFind)


ds = Dataset()
ds.is_little_endian = True
ds.is_implicit_VR = True

item = Dataset()

item.ScheduledStationAETitle = 'RHKFATBUK561'
item.ScheduledProcedureStepStartDate = datetime.strftime(datetime.today(), '%Y%m%d') + "-"


ds.ScheduledProcedureStepSequence = [item]

ds.save_as("test.dicom")
print(ds)
assoc = ae.associate(ip,port, ae_title=AET)
response = assoc.send_c_find(ds, ModalityWorklistInformationFind)


counter = 0
for (status, dataset) in response:
  print(dataset)
  counter += 1

print(counter)
assoc.release()

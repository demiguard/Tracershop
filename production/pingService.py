
import sys

if __name__ != '__main__':
  print("you have imported a script you dummy!")
  sys.exit(1)

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()

# Python Standard Library
from time import sleep
from typing import Optional, Type, TypeVar

# Third party Packages
from django.core.exceptions import ObjectDoesNotExist
from pydicom import Dataset
from pynetdicom import AE, Association
from pynetdicom.sop_class import ModalityWorklistInformationFind #type: ignore

# Tracershop packages
from database.models import ServerConfiguration, Booking, Location, Procedure, TracershopModel, getOrCreateModel



import logging

logger = logging.getLogger('pingServiceLogger')
logger.setLevel(logging.DEBUG)

serverConfig = ServerConfiguration.get()

class DicomConnection:
  def __init__(self, ae: AE, ip, port, aet):
    self.ae = ae
    self.ip = ip
    self.port = port
    self.aet  = aet

  def __enter__(self) -> Optional[Association]:
    self.assoc = self.ae.associate(
      self.ip,
      int(self.port),
      ae_title = self.aet
    )
    if self.assoc.is_established:
      return self.assoc
    else:
      logger.error(f"Could not Establish the connection to {self.aet} - {self.ip}:{self.port}")
      return None
  def __exit__(self, type, value, traceback):
    if self.assoc.is_established:
      self.assoc.release()

def getQueryDataset(serverConfig: ServerConfiguration):
  ds = Dataset()
  ds.PatientName = "*"
  item = Dataset()
  item.ScheduledStationAETitle = serverConfig.ping_service_ae_tile #Move this to DB
  #item.ScheduledProcedureStepStartDate = datetime.strftime(datetime.today()+timedelta(days=1), '%Y%m%d')+'-'
  item.ScheduledProcedureStepLocation = ''
  ds.ScheduledProcedureStepSequence = [item]
  return ds



#### Script

waiting = False

while(True):
  if waiting:
    sleep(900)
  else:
    waiting = True

  serverConfig.refresh_from_db()
  ae = AE(str(serverConfig.ping_service_ae_tile).encode())
  ae.add_requested_context(ModalityWorklistInformationFind)

  ris_dicom_endpoint = serverConfig.ris_dicom_endpoint

  # validate if we can make the queries or there's a setup error
  if ris_dicom_endpoint is None:
    logger.error("Server Config has not set a dicom endpoint to retrieve studies from")
    continue

  ip = ris_dicom_endpoint.address.ip
  port = ris_dicom_endpoint.address.port
  ae_title = ris_dicom_endpoint.ae_title

  active_bookings = set()
  datasets = []

  with DicomConnection(ae, ip, port, ae_title) as assoc:
    if assoc is not None: # error is logged in enter statement
      queryDataset = getQueryDataset(serverConfig)
      response = assoc.send_c_find(queryDataset, ModalityWorklistInformationFind)

      for (status, dataset) in response:
        print(status, dataset)
        if status.Status in (0xFF00, 0xFF01) and isinstance(dataset, Dataset):
          active_bookings.add(dataset.RequestedProcedureID)
          datasets.append(dataset)


  old_bookings = Booking.objects.exclude(accession_number__in=active_bookings)
  logger.debug(f"Deleting old bookings:{old_bookings}")
  old_bookings.delete()

  bookings = []

  for dataset in datasets:
    booking = getOrCreateModel(dataset.RequestedProcedureID, Booking, 'accession_number')

    scheduledProcedureDescription = dataset.ScheduledProcedureStepSequence[0]

    booking.procedure = getOrCreateModel(scheduledProcedureDescription.ScheduledProcedureStepDescription, Procedure, 'series_description')
    booking.procedure.save()
    booking.location = getOrCreateModel(scheduledProcedureDescription.ScheduledProcedureStepLocation, Location, 'location_code')
    booking.location.save()

    unformattedTime = scheduledProcedureDescription.ScheduledProcedureStepStartTime
    booking.start_time = unformattedTime[:2] + ":" + unformattedTime[2:4] + ":" + unformattedTime[4:]
    unformattedDate = scheduledProcedureDescription.ScheduledProcedureStepStartDate
    booking.start_date = unformattedDate[:4] + "-" + unformattedDate[4:6] + "-" + unformattedDate[6:]
    booking.save() # There's no bulk create or update in django

  logger.info(f"Updated bookings - Active bookings: {len(bookings)}")


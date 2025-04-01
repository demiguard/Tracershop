"""This scripts / command starts a server listening for HL7 Messages.
These HL7 messages contains information about the bookings of the customers,
which we can use to calculate the activity a customer would need for all their
orders.

So The HL7 messages don't include timezone in their timestamps?
"""

# Python Standard library
import asyncio
from datetime import date, time, datetime
import logging
import traceback
from typing import Any, Tuple

# Thrid party packages
import aiorun

from channels.db import database_sync_to_async
from channels.layers import get_channel_layer

from django.core.management.base import BaseCommand
from django.core.exceptions import ObjectDoesNotExist

from hl7 import Message, Segment
from hl7.mllp import start_hl7_server, HL7StreamReader, HL7StreamWriter

# Tracershop Packages
from constants import PING_SERVICE_LOGGER
from shared_constants import DATA_BOOKING, WEBSOCKET_SERVER_MESSAGES,\
  WEBSOCKET_DATA_ID, WEBSOCKET_DATA
from database.database_interface import DatabaseInterface
from database.models import Booking, Location, ProcedureIdentifier, BookingStatus
from websocket.messenger import Messenger
logger = logging.getLogger(PING_SERVICE_LOGGER)

database_interface = DatabaseInterface()
messenger = Messenger()

def in_(message, key):
  try:
    message[key]
    return True
  except KeyError:
    return False

@database_sync_to_async
def get_or_create_location(location_str: str) -> Location:
  location, created = Location.objects.get_or_create(location_code=location_str)
  if created:
    logger.info(f"Created Location with code {location_str}")

  return location


@database_sync_to_async
def get_or_create_procedureIdentifier(code, description):
  # This block renames prodcedure identifiers
  try:
    procedure_identifier = ProcedureIdentifier.objects.get(code=code)
    if procedure_identifier.description != description:
      logger.info(f"Changing description from {procedure_identifier.description} to {description} for code {code}")
      procedure_identifier.description = description
      procedure_identifier.save()
  except ObjectDoesNotExist:
    try:
      procedure_identifier = ProcedureIdentifier.objects.get(description=description)
      procedure_identifier.code = code
      logger.info(f"Changing code from {procedure_identifier.code} to {code} for description {description}")
      procedure_identifier.save()
    except ObjectDoesNotExist:
      procedure_identifier, created = ProcedureIdentifier.objects.get_or_create(code=code, description=description)
      if created:
        logger.info(f"Created Procedure Identifier with code: {code} and description: {description}")

  return procedure_identifier


@database_sync_to_async
def create_booking(
  location, procedure_identifier, start_time, start_date, accession_number) -> Booking:
  try:
    booking = Booking.objects.get(accession_number=accession_number)
  except ObjectDoesNotExist:
    booking = Booking(accession_number=accession_number)

  booking.location = location
  booking.procedure = procedure_identifier
  booking.start_date = start_date
  booking.start_time = start_time
  booking.status = BookingStatus.Initial

  booking.save()

  return booking

@database_sync_to_async
def delete_booking(accession_number) -> int:
  try:
    booking = Booking.objects.get(accession_number=accession_number)
    booking_id = booking.id
    booking.delete()
    return booking_id
  except ObjectDoesNotExist:
    logger.error(f"Something fishy is going on with: {accession_number}")
    logger.error("It looks like this booking has been deleted by another message?")
    return 0


def extract_location(ORB_message_segment: Segment):
  return ORB_message_segment[21][0]

def extract_procedure_identifier(OBR_message_segment: Segment):
  study_code, description = OBR_message_segment[4][0]

  return study_code[0], description[0]

def extract_message_type(hl7_message: Message) -> str:
    MESSAGE_TYPE_HEADER_OFFSET = 9
    return hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][0][0] + hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][1][0] #type ignore

def extract_booking_time(ORC_message_segment: Segment) -> Tuple[date, time]:
  # Yeah this is pure magic number I'll try and some non-magic...
  # Also they don't have timezones?
  booking_datetime = datetime.strptime(ORC_message_segment[7][0][3][0], "%Y%m%d%H%M%S")

  return booking_datetime.date(), booking_datetime.time()

def extract_accession_number(ORC_message_segment: Segment):
  return ORC_message_segment[20][0]

async def handle_create_booking_message(ORC_message_segment: Segment, OBR_message_segment: Segment):
  location_str = extract_location(OBR_message_segment)
  location = await get_or_create_location(location_str)

  study_code, study_description = extract_procedure_identifier(OBR_message_segment)
  procedure_identifier = await get_or_create_procedureIdentifier(study_code, study_description)
  accession_number = extract_accession_number(ORC_message_segment)
  start_date, start_time = extract_booking_time(ORC_message_segment)
  booking = await create_booking(location, procedure_identifier, start_time, start_date, accession_number)
  logger.info(f"Added booking with uid: {accession_number}")

  await messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_CREATE_BOOKING, {
      WEBSOCKET_DATA : {
         DATA_BOOKING : [booking]
      }
  })

async def handle_delete_booking(ORC_message_segment: Segment,
                               OBR_message_segment: Segment):
  accession_number = extract_accession_number(OBR_message_segment)
  booking_id = await delete_booking(accession_number)
  logger.info(f"deleted booking with uid: {accession_number}")
  if 0 < booking_id:
    await messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_DELETE_BOOKING, {
      WEBSOCKET_DATA_ID : [booking_id]
    })


async def handleMessage(hl7_message: Message):
  channel_layer = get_channel_layer()
  message_type = extract_message_type(hl7_message)

  if message_type != 'ORMO01':
    logger.error("Received a message that do not belong to this service!")
    return

  if not in_(hl7_message, 'ORC') or not in_(hl7_message,'OBR'):
    logger.error("Received an ORMO01 message that do not belong to this service!")
    logger.error("Reminder that whoever designed the HL7 standard is stupid")
    return

  for ORC_message_segment, OBR_message_segment in zip(hl7_message['ORC'], hl7_message['OBR']):
    # This is the name given by the standard. It is really part of the
    # message type. But for some god forsaken reason, did we decide to have
    # 10 different Message types to the same code
    if ORC_message_segment[1][0] == 'XO' and ORC_message_segment[5][0] != 'ExamStarted':
      await handle_create_booking_message(ORC_message_segment, OBR_message_segment)

    if ORC_message_segment[1][0] == 'DC'  or ORC_message_segment[1][0] == 'CA':

      await handle_delete_booking(ORC_message_segment, OBR_message_segment)

async def process_hl7_messages(hl7_reader: HL7StreamReader, hl7_writer: HL7StreamWriter):
    """This will be called every time a socket connects
    with us.
    """
    peername = hl7_writer.get_extra_info("peername")
    logger.info(f"Connection established {peername}")
    try:
        # We're going to keep listening until the writer
        # is closed. Only writers have closed status.
        while not hl7_writer.is_closing():
            try:
                hl7_message = await hl7_reader.readmessage()
            except ConnectionResetError:
                logger.error("Connection Reset!")
                continue
            logger.info(f'Received message\n {hl7_message}'.replace('\r', '\n'))
            try:
                await handleMessage(hl7_message)
                hl7_writer.writemessage(hl7_message.create_ack())
                await hl7_writer.drain()
            except Exception:
                logger.error(f"Failed To handle Message with traceback:")
                logger.error(traceback.format_exc())

            # Now let's send the ACK and wait for the
            # writer to drain
    except asyncio.IncompleteReadError:
        # This expection is triggered at the end of a message
        # closed or closing, close it.
        if not hl7_writer.is_closing():
            hl7_writer.close()
            await hl7_writer.wait_closed()
    logger.info(f"Connection closed {peername}")



async def main():
    try:
        # Start the server in a with clause to make sure we
        # close it
        async with await start_hl7_server(
            process_hl7_messages, port=2575, encoding='latin-1'
        ) as hl7_server:
            # And now we server forever. Or until we are
            # cancelled...
            await hl7_server.serve_forever()
    except asyncio.CancelledError:
        # Cancelled errors are expected
        pass
    except Exception:
        logger.error("Error occurred in main")
        logger.error(traceback.format_exc())

class Command(BaseCommand):
  def handle(self, *args: Any, **options):
    aiorun.run(main(), stop_on_unhandled_errors=True)

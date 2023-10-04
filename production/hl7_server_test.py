"""Server receiving HL7 messages"""
import dataclasses
from datetime import date, time, datetime
import aiorun
import asyncio
import hl7
from hl7 import Message, Segment
import traceback
from hl7.mllp import start_hl7_server, HL7StreamReader, HL7StreamWriter
from typing import Tuple

import logging

logging.basicConfig(
    filename='hl7.log',
    encoding='utf-8',
    level=logging.DEBUG,
    format="%(asctime)s (%(funcName)s,%(lineno)d) - %(levelname)s - %(message)s"
)

database = {
    'locations' : {},
    'procedureIdentifiers' : {},
    'Bookings' : {}
}


@dataclasses.dataclass
class Location:
    location: str

@dataclasses.dataclass
class ProcedureIdentifier:
    code : str
    study_description : str

@dataclasses.dataclass
class Booking:
    location : Location
    procedure_identifier : ProcedureIdentifier
    start_time : time
    start_date : date
    accession_number : str
    study_uid : str


def in_(message, key):
    try:
        message[key]
        return True
    except KeyError:
        return False


async def get_or_create_location(location_str: str) -> Location:
    if location_str not in database['locations']:
        database['locations'][location_str] = Location(location_str)

    return database['locations'][location_str]

async def get_or_create_procedureIdentifier(code, description):
    if code not in database['procedureIdentifiers']:
        database['procedureIdentifiers'][code] = ProcedureIdentifier(code, description)
    return database['procedureIdentifiers'][code]

async def create_booking(location, procedure_identifier, start_time, start_date, accession_number, study_uid):
    booking = Booking(location, procedure_identifier, start_time, start_date, accession_number, study_uid)
    database['Bookings'][study_uid] = booking

async def delete_booking(study_uid):
    del database['Bookings'][study_uid]

def extract_location(ORB_message_segment: Segment):
    return ORB_message_segment[21][0]

def extract_procedure_identifier(OBR_message_segment: Segment):
    study_code, description = OBR_message_segment[4][0]

    return study_code[0], description[0]

def extract_message_type(hl7_message: Message) -> str:
    MESSAGE_TYPE_HEADER_OFFSET = 9
    return hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][0][0] + hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][1][0]

def extract_booking_time(ORC_message_segment: Segment) -> Tuple[date, time]:
    # Yeah this is pure magic number I'll try and some non-magic...
    booking_datetime = datetime.strptime(ORC_message_segment[7][0][3][0], "%Y%m%d%H%M%S")

    return booking_datetime.date(), booking_datetime.time()

def extract_accession_number(ORC_message_segment: Segment):
    return ORC_message_segment[20][0]

def extract_study_uid(ZDS_segment: Segment):
    return ZDS_segment[1][0]

async def handleMessage(hl7_message: Message):
    message_type = extract_message_type(hl7_message)

    if message_type != 'ORMO01':
        logging.info("Received a message that do not belong to this service!")
        return

    if not in_(hl7_message, 'ORC') or not in_(hl7_message,'OBR'):
        logging.info("Received an ORMO01 message that do not belong to this service!")
        logging.info("Reminder that whoever designed the HL7 standard is stupid")
        return

    for ORC_message_segment, OBR_message_segment, ZDS_message_segment in zip(hl7_message['ORC'], hl7_message['OBR'], hl7_message['ZDS']):
        # This is the name given by the stanard. It is really part of the
        # message type. But for some god forsaken reason, did we decide to have
        # 10 different Message types to the same code
        if ORC_message_segment[1][0] == 'XO' and ORC_message_segment[5][0] == 'Appointed':
            location_str = extract_location(OBR_message_segment)
            location = await get_or_create_location(location_str)

            study_code, study_description = extract_procedure_identifier(OBR_message_segment)
            procedure_identifier = await get_or_create_procedureIdentifier(study_code, study_description)
            accession_number = extract_accession_number(ORC_message_segment)
            start_date, start_time = extract_booking_time(ORC_message_segment)
            study_uid = extract_study_uid(ZDS_message_segment)
            await create_booking(location, procedure_identifier, start_time, start_date, accession_number, study_uid)
            logging.info(f"Added booking with uid: {study_uid}")

        if ORC_message_segment[1][0] == 'XO' and ORC_message_segment[5][0] == 'Ended':
            # Delete
            study_uid = extract_study_uid(ZDS_message_segment)
            await delete_booking(study_uid)
            logging.info(f"deleted booking with uid: {study_uid}")

async def process_hl7_messages(hl7_reader: HL7StreamReader, hl7_writer: HL7StreamWriter):
    """This will be called every time a socket connects
    with us.
    """
    peername = hl7_writer.get_extra_info("peername")
    logging.info(f"Connection established {peername}")
    try:
        # We're going to keep listening until the writer
        # is closed. Only writers have closed status.
        while not hl7_writer.is_closing():
            hl7_message = await hl7_reader.readmessage()
            logging.info(f'Received message\n {hl7_message}'.replace('\r', '\n'))
            # Now let's send the ACK and wait for the
            # writer to drain
            hl7_writer.writemessage(hl7_message.create_ack())
            await hl7_writer.drain()
    except asyncio.IncompleteReadError:
        # This expection is triggered at the end of a message
        # closed or closing, close it.
        if not hl7_writer.is_closing():
            hl7_writer.close()
            await hl7_writer.wait_closed()
    logging.info(f"Connection closed {peername}")


async def main():
    try:
        # Start the server in a with clause to make sure we
        # close it
        async with await start_hl7_server(
            process_hl7_messages, port=2575, encoding='utf-8'
        ) as hl7_server:
            # And now we server forever. Or until we are
            # cancelled...
            await hl7_server.serve_forever()
    except asyncio.CancelledError:
        # Cancelled errors are expected
        pass
    except Exception:
        logging.error("Error occurred in main")
        logging.error(traceback.format_exc())

aiorun.run(main(), stop_on_unhandled_errors=True)

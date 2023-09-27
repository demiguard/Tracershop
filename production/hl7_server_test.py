"""Server receiving HL7 messages"""
import dataclasses
from datetime import date, time, datetime
import aiorun
import asyncio
import hl7
from hl7 import Message
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

database = {}


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


def in_(message, key):
    try:
        message[key]
        return True
    except KeyError:
        return False

def get_location(message: Message):
    pass

def get_procedure_identifier(message: Message):
    pass

def get_message_type(hl7_message: Message) -> str:
    MESSAGE_TYPE_HEADER_OFFSET = 9
    return hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][0][0] + hl7_message['MSH'][0][MESSAGE_TYPE_HEADER_OFFSET][0][1][0]

def get_booking_time(message: Message) -> Tuple[date, time]:
    


async def handleMessage(hl7_message: Message):
    message_type = get_message_type(hl7_message)

    if message_type != 'ORMO01':
        logging.info("Received a message that do not belong to this service!")
        return

    if not in_(hl7_message, 'ORC') or not in_(hl7_message,'OBR'):
        logging.info("Received an ORMO01 message that do not belong to this service!")
        logging.info("Reminder that whoever designed the HL7 standard is stupid")
        return

    for ORC_message_segment, OBR_message_segment in zip(hl7_message['ORC'], hl7_message['OBR']):
        # This is the name given by the stanard. It is really part of the
        # message type. But for some god forsaken reason, did we decide to have
        # 10 different Message types to the same code
        order_control = ORC_message_segment[1]

        if order_control == 'XO' and ORC_message_segment[5] == 'Appointed':
            # booking
            pass

            location = get_location(hl7_message)
            procedure_identifier = get_procedure_identifier(hl7_message)

        if order_control == 'DC':
            # Delete
            pass





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
        logging.info("Incomplete Read Error was triggered!")
        logging.info(traceback.format_exc())
        # Oops, something went wrong, if the writer is not
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

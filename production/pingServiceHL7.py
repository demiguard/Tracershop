# Using the third party `aiorun` instead of the `asyncio.run()` to avoid
# boilerplate.
import aiorun
import asyncio
import hl7
from hl7.mllp import start_hl7_server, HL7StreamReader, HL7StreamWriter

import logging

logging.basicConfig(filename='hl7.log', encoding='utf-8', level=logging.DEBUG)

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
            process_hl7_messages, port=2575
        ) as hl7_server:
            # And now we server forever. Or until we are
            # cancelled...
            await hl7_server.serve_forever()
    except asyncio.CancelledError:
        # Cancelled errors are expected
        pass
    except Exception:
        logging.info("Error occurred in main")


aiorun.run(main(), stop_on_unhandled_errors=True)

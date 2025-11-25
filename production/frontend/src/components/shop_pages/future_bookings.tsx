import React, { Component, useRef, useState } from "react";
import { Card, Col, Collapse, FormCheck, Row, Table } from "react-bootstrap";
import { FormatDateStr, formatAccessionNumber } from "~/lib/formatting";
import { TRACER_TYPE } from "../../lib/constants";
import { cssAlignRight, cssCenter } from "~/lib/styles";
import { ERROR_EARLY_BOOKING_TIME, ERROR_EARLY_TIME_SLOT, WARNING_DUPLICATED_BOOKINGS, WEBSOCKET_DATA, WEBSOCKET_ERROR, WEBSOCKET_MESSAGE_MASS_ORDER, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { Booking, Tracer } from "~/dataclasses/dataclasses";
import { ProcedureLocationIndex, TracerBookingMapping } from "~/lib/data_structures";
import { IdempotentButton } from "~/components/injectable/buttons";
import { TimeStamp } from "~/lib/chronomancy";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { Optional, Options } from "~/components/injectable/optional";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { BOOKING_SORTING_METHODS, sortBookings } from "~/lib/sorting";
import { AlertBox, ERROR_LEVELS } from "~/components/injectable/alert_box";
import { RecoverableError, useErrorState } from "~/lib/error_handling";

// This is a test target, that's why it's here
export const missingSetupHeader = "Ikke opsatte undersøgelser";

type ProcedureCardProps = {
  bookings : Array<Booking>
}

function ProcedureCard({bookings} :  ProcedureCardProps){
  const state = useTracershopState();
  const [open, setOpen] = useState(false);
  // Using Set for eliminating duplicates
  const procedureIdentifierIDs = new Set<number>(
    bookings.map((booking) => {
      return booking.procedure;
    }));

  const rows = [...procedureIdentifierIDs].map(
    (procedureIdentifierID) => {
      const procedureIdentifier = state.procedure_identifier.get(procedureIdentifierID);
      if(procedureIdentifier === undefined){
        console.log(`Procedure Identifier for ${procedureIdentifierID} is undefined!`);
        return null;
      }

      return (<Row key={procedureIdentifierID}>{procedureIdentifier.description}</Row>);
    }
  )

  return (<Card>
    <Card.Header>
      <Row>
        <Col>{missingSetupHeader}</Col>
        <Col style={cssAlignRight}>
          <OpenCloseButton
            label="open-unset-procedures"
            open={open}
            setOpen={setOpen}
          />
        </Col>
      </Row>
    </Card.Header>
    <Collapse in={open}>
      <Card.Body>{rows}</Card.Body>
    </Collapse>
  </Card>);
}

type BookingRowProps = {
  booking : Booking,
  checked : boolean,
}

function BookingRow({
  setBookingProgram,
  booking,
  procedureLocationIndex,
  checked
}){
  const state = useTracershopState();

  const procedure = procedureLocationIndex.getProcedure(booking);
  const series_description = state.procedure_identifier.get(procedure.series_description);
  const location = state.location.get(booking.location);
  const locationName = (location.common_name) ? location.common_name : location.location_code;
  const timeStamp = new TimeStamp(booking.start_time);
  const injectionTimeStamp = new TimeStamp(
    timeStamp.hour + Math.floor((timeStamp.minute + procedure.delay_minutes) / 60), // Hour
    (timeStamp.minute + procedure.delay_minutes) % 60, // Minute
    0 // Seconds
  );

  return (<tr data-testid={`booking-row-${booking.id}`}>
    <td>{formatAccessionNumber(booking.accession_number)}</td>
    <td>{series_description.description}</td>
    <td>{locationName}</td>
    <td>{booking.start_time}</td>
    <td>{FormatDateStr(injectionTimeStamp.hour)}:{FormatDateStr(injectionTimeStamp.minute)}:{FormatDateStr(timeStamp.second)}</td>
    <td style={cssCenter}>
      <Options index={booking.status}>
        <div> {/** Initial */}
          <FormCheck
            checked={checked}
            data-testid={`toggle-${booking.id}`}
            onChange={() => {
              setBookingProgram((prevBookingProgram) => {
                return {...prevBookingProgram, [booking.accession_number] : !checked };
              });
            }}
          />
        </div>
        <div> {/** Ordered */}
          ✅
        </div>
        <div> {/** Rejected */}
          ❌
        </div>
        <div> {/** Released */}

        </div>
      </Options>
    </td>
  </tr>);
}


/**
 *
 * @param {{
*   tracer : Tracer
*   bookings : Array<Booking>
* }} param0
* @returns
*/
function TracerCard({tracer,
                    bookings,
                    activityDeadlineValid,
                    injectionDeadlineValid,
                    procedureLocationIndex

  }) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  // This is overkill, but...
  const bookingListInit = useRef(null);
  if(bookingListInit.current === null){
    bookingListInit.current = {};
    bookings.map((booking) => {
      bookingListInit.current[booking.accession_number] = true;
    });
  }

  const [bookingError, setBookingError] = useErrorState()
  const [sortingMethod, setSortingState] = useState(BOOKING_SORTING_METHODS.START_TIME);
  const [invertedSorting, setInvertedSorting] = useState(1)
  const [open, setOpen] = useState(false);
  const [bookingProgram, setBookingProgram] = useState(bookingListInit.current);

  function setSortingMethod(newMethod){
    return () => {setSortingState(newMethod)}
  }

  async function onClickOrder() {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MASS_ORDER);
    message[WEBSOCKET_DATA] = bookingProgram;
    return websocket.send(message).then((message) => {
      if(message[WEBSOCKET_MESSAGE_TYPE] === WEBSOCKET_ERROR){
        const error_info = message[WEBSOCKET_ERROR];
        if(error_info[ERROR_EARLY_TIME_SLOT]){
          setBookingError(`Kunne ikke oprette bookinger, da et eller flere af injektions tidspunktet: ${error_info[ERROR_EARLY_BOOKING_TIME]} er før tidligste frigivelse tidspunkt kl: ${error_info[ERROR_EARLY_TIME_SLOT]}`);
        } else {
          setBookingError(`Kunne ikke oprette bookinger, da der ikke findes nogle levering af ${tracer.shortname} til denne dato`);
        }
      } else {
        if(message[WEBSOCKET_ERROR] === WARNING_DUPLICATED_BOOKINGS){
          setBookingError(new RecoverableError("Der var allerede nogle ordre, du bedes doubelt checke at ordre er korrekte.", ERROR_LEVELS.warning))
        }
        setBookingError("");
      }
    });
  }

  const deadlineValid = tracer.tracer_type === TRACER_TYPE.ACTIVITY ?
    activityDeadlineValid : injectionDeadlineValid;

  //@ts-ignore
  const rows = [...bookings].sort(sortBookings(sortingMethod, state, invertedSorting)).map(
    (booking, i) => {
      const checked = bookingProgram[booking.accession_number];

      return (<BookingRow
                key={i}
                booking={booking}
                procedureLocationIndex={procedureLocationIndex}
                setBookingProgram={setBookingProgram}
                checked={checked}
      />);
  });

 return (
   <Card>
      <Card.Header>
        <Row>
        <Col>{tracer.shortname}</Col>
         <Col style={cssAlignRight}>
            <OpenCloseButton
              label={`open-tracer-${tracer.id}`}
              open={open}
              setOpen={setOpen}
            />
         </Col>
       </Row>
     </Card.Header>
     <Collapse in={open}>
       <Card.Body>
         <Table>
           <thead>
             <tr>
               <th onClick={setSortingMethod(BOOKING_SORTING_METHODS.ACCESSION_NUMBER)}>Accession</th>
               <th onClick={setSortingMethod(BOOKING_SORTING_METHODS.SERIES_DESCRIPTION)}>Studie</th>
               <th onClick={setSortingMethod(BOOKING_SORTING_METHODS.LOCATION)}>Lokation</th>
               <th onClick={setSortingMethod(BOOKING_SORTING_METHODS.START_TIME)}>Studie tid</th>
               <th>Injektion tid</th>
               <th>Bestil</th>
             </tr>
           </thead>
           <tbody>
             {rows}
           </tbody>
         </Table>
         <Optional exists={deadlineValid}>
          <Row style={{justifyContent : "right",display : "flex",}}>
            <div>
              <AlertBox data-testid={`booking_error-${tracer.id}`} error={bookingError}/>
            </div>

            <div>
              <IdempotentButton
                data-testid={`order-button-${tracer.id}`}
                onClick={onClickOrder}>Bestil
              </IdempotentButton>
            </div>
           </Row>
         </Optional>
       </Card.Body>
     </Collapse>
   </Card>);
}

/** Displays bookings for the active date prop and the endpoint prop. Allows the
 * user to order bookings by tracer
 *
 * @param {{
 *  active_date : Date,
 *  active_endpoint : Number,
 *  activityDeadlineValid : Boolean,
 *  injectionDeadlineValid : Boolean,
 *  booking : Array<Booking>
 * }} props
 *
 * @returns {Component}
 */
export function FutureBooking ({active_endpoint, booking,
  activityDeadlineValid, injectionDeadlineValid}) {
  const state = useTracershopState();
  const procedureLocationIndex = new ProcedureLocationIndex(state.procedure,
                                                            state.location,
                                                            active_endpoint);
  const bookingMapping = new TracerBookingMapping(booking, procedureLocationIndex);

  const bookingCards = []
  let index = 0;

  for (const [tracerID, BookingArray] of bookingMapping) {
    index++; // I know, you could start with 0, but this just taste
    const tracer = state.tracer.get(tracerID);
    if(tracer === undefined || tracerID === null){
      bookingCards.push(<ProcedureCard
        key={index}
        bookings={BookingArray}
      />);
    } else {
      bookingCards.push(
        <TracerCard
          key={index}
          tracer={tracer}
          bookings={BookingArray}
          activityDeadlineValid={activityDeadlineValid}
          injectionDeadlineValid={injectionDeadlineValid}
          procedureLocationIndex={procedureLocationIndex}
        />);
    }
  }

  return(
    <div>
      {bookingCards}
    </div>);
}

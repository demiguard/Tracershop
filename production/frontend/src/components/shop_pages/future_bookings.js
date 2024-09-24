import React, { Component, useRef, useState } from "react";
import { Card, Col, Collapse, FormCheck, Row, Table } from "react-bootstrap";
import { FormatDateStr, dateToDateString } from "~/lib/formatting";
import { TRACER_TYPE, cssAlignRight, cssCenter } from "../../lib/constants";
import { WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MASS_ORDER } from "~/lib/shared_constants";
import { Booking, Tracer } from "~/dataclasses/dataclasses";
import { ProcedureLocationIndex, TracerBookingMapping } from "~/lib/data_structures";
import { ClickableIcon } from "~/components/injectable/icons";
import { MarginButton } from "~/components/injectable/buttons";
import { TimeStamp } from "~/lib/chronomancy";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { Optional, Options } from "~/components/injectable/optional";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { BOOKING_SORTING_METHODS, sortBookings } from "~/lib/sorting";

// This is a test target, that's why it's here
export const missingSetupHeader = "Ikke opsatte undersøgelser";

  /** This component is for showing booking for not setup
 *
 * @param {{
  *  bookings : Array<Booking>
  * }} param0
  * @returns
  */
  function ProcedureCard({bookings}){
    const state = useTracershopState();
    const [open, setOpen] = useState(false);
    // Using Set for eliminating duplicates
    const /**@type {Set<Number>} */ procedureIdentifierIDs = new Set(
      bookings.map((booking) => {
        return booking.procedure;
      }));

    const rows = [...procedureIdentifierIDs].map(
      (procedureIdentifierID) => {
        const procedureIdentifier = state.procedure_identifier.get(procedureIdentifierID);
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
    </Card>)
}

/**
 *
 * @param {{
 *   booking : Booking
 * }} param0
 * @returns
 */
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

  return (<tr data-testid={`booking-row-${booking.accession_number}`}>
    <td>{booking.accession_number}</td>
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

  const [sortingMethod, setSortingState] = useState(BOOKING_SORTING_METHODS.START_TIME);
  const [open, setOpen] = useState(false);
  const [bookingProgram, setBookingProgram] = useState(bookingListInit.current);

  function setSortingMethod(newMethod){
    return () => {setSortingState(newMethod)}
  }

  function onClickOrder() {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MASS_ORDER);
    message[WEBSOCKET_DATA] = bookingProgram;
    websocket.send(message);
  }

  const deadlineValid = tracer.tracer_type === TRACER_TYPE.ACTIVITY ?
    activityDeadlineValid : injectionDeadlineValid;

  const rows = [...bookings].sort(sortBookings(sortingMethod, state)).map(
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
              <MarginButton
                data-testid={`order-button-${tracer.id}`}
                onClick={onClickOrder}>Bestil
              </MarginButton>
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
        procedures={state.procedure}
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

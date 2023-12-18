import React, { Component, useRef, useState } from "react";
import { Card, Col, Collapse, FormCheck, Row, Table } from "react-bootstrap";
import { FormatDateStr, dateToDateString } from "~/lib/formatting";
import { TRACER_TYPE, cssAlignRight, cssCenter } from "../../lib/constants";
import { WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MASS_ORDER } from "~/lib/shared_constants";
import { Booking, Tracer } from "~/dataclasses/dataclasses";
import { ProcedureLocationIndex, TracerBookingMapping } from "~/lib/data_structures";
import { ClickableIcon } from "~/components/injectable/icons";
import SiteStyles from "~/css/Site.module.css"
import { MarginButton } from "~/components/injectable/buttons";
import { TimeStamp } from "~/lib/chronomancy";
import { bookingFilter } from "~/lib/filters";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { Optional } from "~/components/injectable/optional";

// This is a test target, that's why it's here
export const missingSetupHeader = "Ikke opsatte undersøgelser";

export function FutureBooking ({active_date, active_endpoint,
  activityDeadlineExpired, injectionDeadlineExpired}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const dateString = dateToDateString(active_date);
  const procedureLocationIndex = new ProcedureLocationIndex(state.procedure,
                                                            state.location,
                                                            active_endpoint);

  // Note that there's no state in this component, so that means there's no
  // rerender with user interaction, therefore the following line will only
  // happen when stuff is relevant
  // Although there's some argument for just creating a bit top level data
  // structure

  const bookings = [...state.booking.values()].filter(bookingFilter(
    dateString, state.location, active_endpoint
  ));

  const bookingMapping = new TracerBookingMapping(bookings, procedureLocationIndex);

  /**
 *
 * @param {{
 *  bookings : Array<Booking>
  * }} param0
  * @returns
  */
  function ProcedureCard({bookings}){
    const [open, setOpen] = useState(false);
    const openClassName = open ? SiteStyles.rotated : "";
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
                <ClickableIcon
                  label="open-unset-procedures"
                  className={openClassName}
                  src={"/static/images/next.svg"}
                  onClick={() => {setOpen(!open)}}
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
*   tracer : Tracer
*   bookings : Array<Booking>
* }} param0
* @returns
*/
function TracerCard({tracer,
                    bookings,
  }) {

  // This is overkill, but...
  const bookingListInit = useRef(null);
  if(bookingListInit.current === null){
    bookingListInit.current = {};
    bookings.map((booking) => {
      bookingListInit.current[booking.accession_number] = true;
    });
  }

  const [open, setOpen] = useState(false);
  const [bookingProgram, setBookingProgram] = useState(bookingListInit.current);


  function onClickOrder() {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MASS_ORDER);
    message[WEBSOCKET_DATA] = bookingProgram;
    websocket.send(message);
  }

  const openClassName = open ? SiteStyles.rotated : "";
  const deadlineExpired = tracer.tracer_type === TRACER_TYPE.ACTIVITY ?
     activityDeadlineExpired : injectionDeadlineExpired;

  let rows = bookings.sort(
    (booking_1, booking_2) => {
      return booking_2.start_time < booking_1.start_time;
    }).map(
      (booking, i) => {
        const procedure = procedureLocationIndex.getProcedure(booking);
        const series_description = state.procedure_identifier.get(procedure.series_description);
        const location = state.location.get(booking.location);
        const checked = bookingProgram[booking.accession_number];
        const locationName = (location.common_name) ? location.common_name : location.location_code;
        const timeStamp = new TimeStamp(booking.start_time);
        const injectionTimeStamp = new TimeStamp(
          timeStamp.hour + Math.floor((timeStamp.minute + procedure.delay_minutes) / 60), // Hour
          (timeStamp.minute + procedure.delay_minutes) % 60, // Minute
          0 // Seconds
        );

        return (<tr key={i}>
          <td>{booking.accession_number}</td>
          <td>{series_description.description}</td>
          <td>{locationName}</td>
          <td>{booking.start_time}</td>
          <td>{FormatDateStr(injectionTimeStamp.hour)}:{FormatDateStr(injectionTimeStamp.minute)}:{FormatDateStr(timeStamp.second)}</td>
          <td style={cssCenter}><FormCheck
              checked={checked}
              data-testid={`toggle-${booking.id}`}
              onChange={() => {
                setBookingProgram((prevBookingProgram) => {
                  return {...prevBookingProgram, [booking.accession_number] : !checked };
                });
              }}
              />
          </td>
        </tr>);
  });

 return (
   <Card>
      <Card.Header>
        <Row>
        <Col>{tracer.shortname}</Col>
         <Col style={cssAlignRight}>
            <ClickableIcon
              label={`open-tracer-${tracer.id}`}
              className={openClassName}
              src={"/static/images/next.svg"}
              onClick={() => {setOpen(!open)}}
            />
         </Col>
       </Row>
     </Card.Header>
     <Collapse in={open}>
       <Card.Body>
         <Table>
           <thead>
             <tr>
               <th>Accession</th>
               <th>Studie</th>
               <th>Lokation</th>
               <th>Studie tid</th>
               <th>Injektion tid</th>
               <th>Bestil</th>
             </tr>
           </thead>
           <tbody>
             {rows}
           </tbody>
         </Table>
         <Optional exists={!deadlineExpired}>
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
        activityDeadlineExpired={activityDeadlineExpired}
        injectionDeadlineExpired={injectionDeadlineExpired}
        />);
    }
  }

  return(
    <div>
      {bookingCards}
    </div>);
}

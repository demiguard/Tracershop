import React, { Component, useRef, useState } from "react";
import { Card, Col, Collapse, FormCheck, Row, Table } from "react-bootstrap";
import { FormatDateStr, dateToDateString } from "~/lib/formatting";
import { PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, TRACER_TYPE, cssAlignRight, cssCenter } from "../../lib/constants";
import { DATA_BOOKING, DATA_LOCATION, DATA_PROCEDURE, DATA_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MASS_ORDER } from "~/lib/shared_constants";
import { Booking, Procedure, Tracer, Location } from "~/dataclasses/dataclasses";
import { ProcedureLocationIndex, TracerBookingMapping } from "~/lib/data_structures";
import { ClickableIcon } from "~/components/injectable/icons";
import SiteStyles from "~/css/Site.module.css"
import { MarginButton } from "~/components/injectable/buttons";
import { getTimeStamp } from "~/lib/chronomancy";
import { TracerWebSocket } from "~/lib/tracer_websocket";
import { bookingFilter } from "~/lib/filters";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";

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

  const bookingListInit = useRef(null)
  if(bookingListInit.current === null){
    bookingListInit.current = {}
    bookings.map((booking) => {
      bookingListInit[booking.accession_number] = true;
    });
  }

  const [open, setOpen] = useState(false)
  const [orderList, _setState] = useState(bookingListInit)

  function setState(newState){
    _setState({
      ...orderList,
      ...newState,
    })
  }

  function onClickOrder() {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MASS_ORDER);
    message[WEBSOCKET_DATA] = orderList;
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
        const location = state.location.get(booking.location);
        const checked = orderList[booking.accession_number];
        const locationName = (location.common_name) ? location.common_name : location.location_code;
        const timeStamp = getTimeStamp(booking.start_time);
        const injectionTimeStamp = {
          hour : timeStamp.hour + Math.floor((timeStamp.minute + procedure.delay_minutes) / 60),
          minute : (timeStamp.minute + procedure.delay_minutes) % 60
        };

        return (<tr key={i}>
          <td>{booking.accession_number}</td>
          <td>{procedure.series_description}</td>
          <td>{locationName}</td>
          <td>{booking.start_time}</td>
          <td>{FormatDateStr(injectionTimeStamp.hour)}:{FormatDateStr(injectionTimeStamp.minute)}:{FormatDateStr(timeStamp.second)}</td>
          <td style={cssCenter}><FormCheck
              checked={checked}
              data-testid={`toggle-${booking.id}`}
              onChange={() => {
                const newState = {}
                newState[booking.accession_number] = !checked
                setState(newState)
              }}
              />
          </td>
        </tr>);
  });

 return (
   <Card>
      <Card.Header>
        <Row>
        <Col>{tracer.shortname}</Col>;
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
               <th>Injecktion tid</th>
               <th>Bestil</th>
             </tr>
           </thead>
           <tbody>
             {rows}
           </tbody>
         </Table>
         { deadlineExpired ? "" : <Row style={{justifyContent : "right",display : "flex",}}>
             <div>
               <MarginButton
                data-testid={`order-button-${tracer.id}`}
                onClick={onClickOrder}>Bestil</MarginButton>
             </div>
           </Row>
         }
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


import React, { Component, useState } from "react";
import { FormatDateStr, dateToDateString } from "../../lib/formatting";
import { JSON_BOOKING, JSON_LOCATION, JSON_PROCEDURE, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_WEBSOCKET, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MASS_ORDER, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, } from "../../lib/constants";
import { Booking, Procedure, Tracer, Location } from "../../dataclasses/dataclasses";
import { ProcedureLocationIndex, TracerBookingMapping, createBookingTracerMapping, createTracerCatalogForCustomer } from "../../lib/data_structures";
import { Card, Col, Collapse, FormCheck, Row, Table } from "react-bootstrap";
import { ClickableIcon } from "../injectable/icons";
import SiteStyles from "/src/css/Site.module.css"
import { MarginButton } from "../injectable/buttons";
import { getTimeStamp } from "../../lib/chronomancy";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { bookingFilter } from "../../lib/filters";

/**
 * 
 * @param {{
 *  bookings : Array<Booking>
 *  procedures : Map<Number, Procedure>
 * }} param0 
 * @returns 
 */
function ProcedureCard({bookings, procedures}){
  const [open, setOpen] = useState(false);
  const openClassName = open ? SiteStyles.rotated : "";

  const /**@type {Set<Number>} */ proceduresIDs = new Set();
  bookings.map((booking) => {
      proceduresIDs.add(booking.procedure);
  });

  const rows = [...proceduresIDs].map(
    (procedureID, i) => {
      const procedure = procedures.get(procedureID);
      return (<Row key={i}>{procedure.series_description}</Row>);
    }
  )

  return (<Card>
    <Card.Header>
      <Row>
        <Col>Ikke opsatte undersøgelse</Col>
        <Col style={{
          justifyContent : 'right',
          display : 'flex'
        }}>
              <ClickableIcon
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
 *   procedures : Map<Number, Procedure>
 *   locations : Map<Number, Location>
 *   websocket : TracerWebSocket
 *   injectionDeadlineExpired : Boolean
 *   activityDeadlineExpired : Boolean
 * }} param0 
 * @returns 
 */
function TracerCard({tracer,
                     bookings,
                     procedures,
                     locations,
                     websocket,
                     injectionDeadlineExpired,
                     activityDeadlineExpired,
  }) {

  const bookingState = {}
  bookings.map((booking) => {
    bookingState[booking.accession_number] = true;
  })

  const [open, setOpen] = useState(false)
  const [state, _setState] = useState(bookingState)

  function setState(newState){
    _setState({
      ...state,
      ...newState,
    })
  }

  function onClickOrder() {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MASS_ORDER);
    message[WEBSOCKET_DATA] = state;
    websocket.send(message);
  }

  const openClassName = open ? SiteStyles.rotated : "";
  let tracerDescriptor = <Col>{tracer.shortname}</Col>;


  const deadlineExpired = tracer.tracer_type === 1 ? activityDeadlineExpired : injectionDeadlineExpired;


  let rows = bookings.sort(
    (booking_1, booking_2) => {
      return booking_2.start_time < booking_1.start_time;
    }).map(
      (booking, i) => {
        const procedure = (procedures !== undefined) ?
                              procedures.get(booking.procedure)
                            : { series_description : "Hello world" };
        const location = locations.get(booking.location);
        const checked = state[booking.accession_number];
        const locationName = (location.common_name) ? location.common_name : location.location_code;
        const timeStamp = getTimeStamp(booking.start_time);

        const injectionTimeStamp = {
          hour : timeStamp.hour + Math.floor((timeStamp.minute + procedure.delay_minutes) / 60),
          minute : (timeStamp.minute + procedure.delay_minutes) % 60
        }

        return (<tr key={i}>
          <td>{booking.accession_number}</td>
          <td>{procedure.series_description}</td>
          <td>{locationName}</td>
          <td>{booking.start_time}</td>
          <td>{FormatDateStr(injectionTimeStamp.hour)}:{FormatDateStr(injectionTimeStamp.minute)}:{FormatDateStr(timeStamp.second)}</td>
          <td style={{
            justifyContent : 'center',
            display : 'flex'
          }}><FormCheck
              checked={checked}
              onChange={() => {
                const newState = {}
                newState[booking.accession_number] = !checked
                setState(newState)
              }}
              />
          </td>
        </tr>
        )
      });

  return (
    <Card>
      <Card.Header>
        <Row>
          {tracerDescriptor}
          <Col style={{
            justifyContent : 'right',
            display : 'flex'
          }}>
              <ClickableIcon
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
          { deadlineExpired ? <Row style={{justifyContent : "right",display : "flex",}}>
              <div>
                <MarginButton onClick={onClickOrder}>Bestil</MarginButton>
              </div>
            </Row> : ""
          }
        </Card.Body>
      </Collapse>
    </Card>)
}


export function FutureBooking (props) {
  const dateString = dateToDateString(props[PROP_ACTIVE_DATE]);
  const procedureLocationIndex = new ProcedureLocationIndex(props[JSON_PROCEDURE],
                                                            props[JSON_LOCATION]);

  const bookings = [...props[JSON_BOOKING].values()].filter(bookingFilter(
    dateString, procedureLocationIndex
  ))

  const bookingMapping = new TracerBookingMapping(bookings, procedureLocationIndex);
  const bookingCards = [...bookingMapping].map(
    ([tracerID, BookingArray], i) => {
      const tracer=props[JSON_TRACER].get(tracerID);
      if(tracer === undefined){
        return <ProcedureCard
          key={i}
          bookings={BookingArray}
          procedures={props[JSON_PROCEDURE]}
        />;
      }

      return <TracerCard
        key={i}
        tracer={tracer}
        bookings={BookingArray}
        procedures={props[JSON_PROCEDURE]}
        locations={props[JSON_LOCATION]}
        websocket={props[PROP_WEBSOCKET]}
        activityDeadlineExpired={props[PROP_EXPIRED_ACTIVITY_DEADLINE]}
        injectionDeadlineExpired={props[PROP_EXPIRED_INJECTION_DEADLINE]}
      />;
    }
  )

  return(
    <div>
      {bookingCards}
    </div>);
}


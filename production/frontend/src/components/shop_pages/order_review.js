import React, { useState } from "react";
import { Card, Collapse, Container, Form, Row, Col, Button, FormControl, InputGroup, Modal } from "react-bootstrap";

import { INJECTION_USAGE, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT,
  PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE,
  TRACER_TYPE_ACTIVITY } from "../../lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME, DATA_ENDPOINT,
  DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_PRODUCTION, DATA_TRACER, DATA_TRACER_MAPPING,
  DATA_VIAL } from "~/lib/shared_constants"
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, InjectionOrder, Tracer, TracerCatalog } from "~/dataclasses/dataclasses";
import { getId } from "../../lib/utils";
import { FormatDateStr, FormatTime, ParseDanishNumber, dateToDateString, nullParser } from "~/lib/formatting";
import { Select } from "../injectable/select.js"
import SiteStyles from '~/css/Site.module.css'
import { ClickableIcon, StatusIcon } from "../injectable/icons";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";
import { TracerWebSocket } from "~/lib/tracer_websocket";
import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCard } from "./shop_injectables/time_slot_card";
import { getDay, getToday } from "~/lib/chronomancy";
import { CalculatorModal } from "../modals/calculator_modal";
import { useWebsocket } from "../tracer_shop_context";

/**
 * This object is the manual ordering and review for activity based orders
 * @param {{
 *    activityDeadlineExpired : Boolean,
 *    injectionDeadlineValid : Boolean
 * }} props
 * @returns Element
 */
export function OrderReview(props){
  const /**@type {DeliveryEndpoint} */ endpoint = props[DATA_ENDPOINT].get(props[PROP_ACTIVE_ENDPOINT])
  const websocket = useWebsocket();
  const /**@type {Map<Number, Number} */ overheadMap = new Map();
  const /**@type {Array<Tracer>} */ availableActivityTracers = [];
  const /**@type {Array<Tracer>} */ availableInjectionTracers = [];

  for(const [pageID, _tracerCatalogPage] of props[DATA_TRACER_MAPPING]){
    const /**@type {TracerCatalog} */ page = _tracerCatalogPage;
    if(page.customer != props[PROP_ACTIVE_CUSTOMER]){
      continue;
    }
    const /**@type {Tracer} */ tracer = props[DATA_TRACER].get(page.tracer);
    if(tracer.tracer_type === TRACER_TYPE_ACTIVITY){
      overheadMap.set(page.tracer, page.overhead_multiplier);
      availableActivityTracers.push(tracer);
    } else {
      availableInjectionTracers.push(tracer);
    }
  }

  // State Definitions
  let activeTracerInit = -1
  if (0 < availableActivityTracers.length){
    activeTracerInit = availableActivityTracers[0].id
  }

  const [activeTracer, setActiveTracer] = useState(activeTracerInit);

  const day = getDay(props[PROP_ACTIVE_DATE]);
  const dateString = dateToDateString(props[PROP_ACTIVE_DATE]);

  const availableProductions = [...props[DATA_PRODUCTION].values()].filter(
    (_production) => {
      const /**@type {ActivityProduction} */ production = _production

      return production.production_day === day && production.tracer === activeTracer
  }).map(getId)


  const availableTimeSlots = [...props[DATA_DELIVER_TIME].values()].filter(
    (_timeSlot) => {
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _timeSlot

      const cond1 = availableProductions.includes(timeSlot.production_run)
      const cond2 = timeSlot.destination === endpoint.id

      return cond1 && cond2;
    }).map(getId)

  const dateConstraint = dateToDateString(props[PROP_ACTIVE_DATE]);
  const relevantActivityOrders = [...props[DATA_ACTIVITY_ORDER].values()].filter(
    (_activityOrder) => {
      const /**@type {ActivityOrder} */ activityOrder = _activityOrder
      const timeSlotConstraint = availableTimeSlots.includes(activityOrder.ordered_time_slot);
      return timeSlotConstraint && dateConstraint === activityOrder.delivery_date;
  });

  function setTracer(tracer){
    return (e) => {
      setActiveTracer(tracer.id);
    }
  }


  const tracerButtons = availableActivityTracers.map((_tracer) => {
    const /**@type {Tracer} */ tracer = _tracer;
    const underline = tracer.id === activeTracer;

    return (<Button
      className={SiteStyles.Margin15lr}
      key={tracer.id}
      onClick={setTracer(tracer)}
      sz="sm"
    >
      {underline ? <u>{tracer.shortname}</u> : tracer.shortname}
    </Button>)
  })

  const overhead = overheadMap.get(activeTracer);

  // If activeTracer is -1, then availableTimeSlot should be [], hence no bugs
  const timeSlotsCards = availableTimeSlots.map((timeSlotID) => {
    const timeSlot = props[DATA_DELIVER_TIME].get(timeSlotID);
    return(<TimeSlotCard
      endpoint={endpoint}
      key={timeSlotID}
      activeTracer={props[DATA_TRACER].get(activeTracer)}
      timeSlot={timeSlot}
      timeSlots={props[DATA_DELIVER_TIME]}
      date={props[PROP_ACTIVE_DATE]}
      isotopes={props[DATA_ISOTOPE]}
      activityOrders={relevantActivityOrders}
      websocket={websocket}
      overhead={overhead}
      validDeadline={!props[PROP_EXPIRED_ACTIVITY_DEADLINE]}
      vials={props[DATA_VIAL]}
      />)
    })

  const /**@type {Array<InjectionOrder>} */ relevantInjectionOrders = [...props[DATA_INJECTION_ORDER].values()].filter(
    (_injectionOrder) => {
      const /**@type {InjectionOrder} */ injectionOrder = _injectionOrder
      const matchingDay = injectionOrder.delivery_date === dateString;
      const matchingEndpoint = injectionOrder.endpoint === props[PROP_ACTIVE_ENDPOINT];
      return matchingDay && matchingEndpoint;
  })

  const InjectionOrderCards = relevantInjectionOrders.map((injectionOrder) => {
    return (<InjectionOrderCard
      key={injectionOrder.id}
      injectionOrder={injectionOrder}
      injectionTracers = {availableInjectionTracers}
      websocket={websocket}
      validDeadline={props.injectionDeadlineValid}
    />);
  })

  if(!(props[PROP_EXPIRED_INJECTION_DEADLINE]) && (availableInjectionTracers.length)) {
    InjectionOrderCards.push(<InjectionOrderCard
                                key={-1}
                                injectionOrder={{
                                  delivery_time : "",
                                  delivery_date : dateString,
                                  injections : "",
                                  status : 0,
                                  tracer_usage : INJECTION_USAGE.human,
                                  comment : "",
                                  ordered_by : null,
                                  endpoint : props[PROP_ACTIVE_ENDPOINT],
                                  tracer : availableInjectionTracers[0].id,
                                }}
                                injectionTracers = {availableInjectionTracers}
                                websocket={websocket}
  />);
  }

  return (
  <Row>
    <Row style={{margin : '15px'}}>
      <Col>{tracerButtons}</Col>
    </Row>
    <Row>
      {activeTracer !== -1 ? timeSlotsCards : <h3>
        Der ikke valgt en aktivitets tracer, klik på en af dem for at bestille den.
      </h3>}
    </Row>
    { InjectionOrderCards.length ?
      <Row style={{margin : '15px'}}><h3>Injection Ordre</h3></Row> : ""}
    { InjectionOrderCards.length ?
      <Row>{InjectionOrderCards}</Row>  : "" }
  </Row>);
}
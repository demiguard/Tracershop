import React, { Component, useState } from "react";
import { ERROR_BACKGROUND_COLOR, INJECTION_USAGE, JSON_ACTIVITY_ORDER, JSON_DELIVER_TIME, JSON_INJECTION_ORDER, JSON_PRODUCTION, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, TRACER_TYPE_ACTIVITY } from "../../lib/constants";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, InjectionOrder, Tracer, TracerCatalog } from "../../dataclasses/dataclasses";
import { Card, Collapse, Container, Form, Row, Col, Button, FormControl, InputGroup } from "react-bootstrap";
import { getId } from "../../lib/utils";
import { FormatDateStr, FormatTime, ParseDanishNumber, dateToDateString, nullParser } from "../../lib/formatting";
import { Select } from "../injectable/select.js"
import SiteStyles from '../../css/Site.module.css'
import { ClickableIcon, StatusIcon } from "../injectable/icons";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCard } from "./shop_injectables/time_slot_card";
import { getDay, getToday } from "../../lib/chronomancy";




/**
 * This object is the manual ordering and review for activity based orders
 * @param {{
 *    activityDeadlineExpired : Boolean,
 *    injectionDeadlineExpired : Boolean
 * }} props 
 * @returns Element
 */
export function OrderReview(props){
  const /**@type {Map<Number, Number} */ overheadMap = new Map();
  const /**@type {Array<Tracer>} */ availableActivityTracers = [];
  const /**@type {Array<Tracer>} */ availableInjectionTracers = [];

  for(const [pageID, _tracerCatalogPage] of props[JSON_TRACER_MAPPING]){
    const /**@type {TracerCatalog} */ page = _tracerCatalogPage;
    if(page.customer != props[PROP_ACTIVE_CUSTOMER]){
      continue;
    }
    const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(page.tracer);
    if(tracer.tracer_type === TRACER_TYPE_ACTIVITY){
      overheadMap.set(page.tracer, page.overhead_multiplier);
      availableActivityTracers.push(tracer);
    } else {
      availableInjectionTracers.push(tracer);
    }
  }

  const [activeTracer, setActiveTracer] = useState(availableActivityTracers[0].id);
  const day = getDay(props[PROP_ACTIVE_DATE]);
  const dateString = dateToDateString(props[PROP_ACTIVE_DATE]);


  const availableProductions = [...props[JSON_PRODUCTION].values()].filter(
    (_production) => {
      const /**@type {ActivityProduction} */ production = _production

      return production.production_day === day && production.tracer === activeTracer
  }).map(getId)


  const availableTimeSlots = [...props[JSON_DELIVER_TIME].values()].filter(
    (_timeSlot) => {
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _timeSlot

      const cond1 = availableProductions.includes(timeSlot.production_run)
      const cond2 = timeSlot.destination === props[PROP_ACTIVE_ENDPOINT]


      return cond1 && cond2;
    }).map(getId)

  const relevantActivityOrders = [...props[JSON_ACTIVITY_ORDER].values()].filter(
    (_activityOrder) => {
      const /**@type {ActivityOrder} */ activityOrder = _activityOrder
      const dateConstraint = dateToDateString(props[PROP_ACTIVE_DATE])
      const timeSlotConstraint = availableTimeSlots.includes(activityOrder.ordered_time_slot);

      return dateConstraint === activityOrder.delivery_date && timeSlotConstraint;
  })

  function setTracer(tracer){
    return (e) => {
      setActiveTracer(tracer.id)
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

  const timeSlotsCards = availableTimeSlots.map((timeSlotID) => {
    const timeSlot = props[JSON_DELIVER_TIME].get(timeSlotID);
    return(<TimeSlotCard
      key={timeSlotID}
      timeSlot={timeSlot}
      timeSlots={props[JSON_DELIVER_TIME]}
      date={props[PROP_ACTIVE_DATE]}
      activityOrders={relevantActivityOrders}
      websocket={props[PROP_WEBSOCKET]}
      overhead={overhead}
      expiredDeadline={props.activityDeadlineExpired}
      />)
    })

  const /**@type {Array<InjectionOrder>} */ relevantInjectionOrders = [...props[JSON_INJECTION_ORDER].values()].filter(
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
      websocket={props[PROP_WEBSOCKET]}
      expiredDeadline={props.injectionDeadlineExpired}
    />);
  })

  

  if(!props.injectionDeadlineExpired) {InjectionOrderCards.push(<InjectionOrderCard
    key={-1}
    injectionOrder={{
      delivery_time : "",
      delivery_date : dateString,
      injections : "",
      status : 0,
      tracer_usage : 1,
      comment : "",
      ordered_by : null,
      endpoint : props[PROP_ACTIVE_ENDPOINT],
      tracer : availableInjectionTracers[0].id,
    }}
    injectionTracers = {availableInjectionTracers}
    websocket={props[PROP_WEBSOCKET]}
  />)
  }

  return (
  <Row>
    <Row style={{margin : '15px'}}>
      <Col>{tracerButtons}</Col>
    </Row>
    <Row>
      {timeSlotsCards}
    </Row>
    { InjectionOrderCards.length ?
      <Row style={{margin : '15px'}}><h3>Injection Ordre</h3></Row> : ""}
    { InjectionOrderCards.length ?
      <Row>{InjectionOrderCards}</Row>  : "" }
  </Row>);
}
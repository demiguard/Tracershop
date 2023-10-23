import React, { useState } from "react";
import { Row, Col, Button } from "react-bootstrap";

import { INJECTION_USAGE, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT,
  PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE,
  TRACER_TYPE_ACTIVITY } from "../../lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME, DATA_ENDPOINT,
  DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_PRODUCTION, DATA_TRACER, DATA_TRACER_MAPPING,
  DATA_VIAL } from "~/lib/shared_constants"
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, InjectionOrder, Tracer } from "~/dataclasses/dataclasses";
import { getId } from "../../lib/utils";
import { dateToDateString } from "~/lib/formatting";

import SiteStyles from '~/css/Site.module.css'
import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCard } from "./shop_injectables/time_slot_card";
import { getDay, getToday } from "~/lib/chronomancy";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { TracerCatalog } from "~/lib/data_structures";
import { getRelevantActivityOrders } from "~/lib/filters";


/**
 * This object is the manual ordering and review for activity based orders
 * @param {{
 *    activityDeadlineExpired : Boolean,
 *    injectionDeadlineValid : Boolean
 * }} props
 * @returns Element
 */
export function OrderReview({active_endpoint, active_customer, active_date,
  injectionDeadlineValid, activityDeadlineExpired,
}){
  const state = useTracershopState()
  const websocket = useWebsocket();

  const tracerCatalog = new TracerCatalog(
    state.tracer_mapping, state.tracer
  )

  const /**@type {Array<Tracer>} */ availableActivityTracers = tracerCatalog.getActivityCatalog(active_customer);
  const /**@type {Array<Tracer>} */ availableInjectionTracers = tracerCatalog.getInjectionCatalog(active_customer);


  // State Definitions
  let activeTracerInit = -1
  if (0 < availableActivityTracers.length){
    activeTracerInit = availableActivityTracers[0].id
  }

  const [activeTracer, setActiveTracer] = useState(activeTracerInit);

  const day = getDay(active_date);
  const activeDateString = dateToDateString(active_date);

  const [, // AvailableProductions
         availableTimeSlots,
         relevantActivityOrders] = getRelevantActivityOrders(state,
                                                             day,
                                                             activeTracer,
                                                             active_endpoint,
                                                             activeDateString);

  function setTracer(tracer){
    return () => {
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

  const overhead = tracerCatalog.getOverheadForTracer(active_customer, activeTracer)

  // If activeTracer is -1, then availableTimeSlot should be [], hence no bugs
  const timeSlotsCards = availableTimeSlots.map((timeSlotID) => <TimeSlotCard
      key={timeSlotID}
      timeSlotID={timeSlotID}
      active_date={active_date}
      activityOrders={relevantActivityOrders}
      overhead={overhead}
      activityDeadlineExpired={activityDeadlineExpired}
      />);

  const /**@type {Array<InjectionOrder>} */ relevantInjectionOrders = [...state.injection_orders.values()].filter(
    (_injectionOrder) => {
      const /**@type {InjectionOrder} */ injectionOrder = _injectionOrder
      const matchingDay = injectionOrder.delivery_date === activeDateString;
      const matchingEndpoint = injectionOrder.endpoint === active_endpoint;
      return matchingDay && matchingEndpoint;
  })

  const InjectionOrderCards = relevantInjectionOrders.map((injectionOrder) => {
    return (<InjectionOrderCard
      key={injectionOrder.id}
      injectionOrder={injectionOrder}
      injectionTracers = {availableInjectionTracers}
      websocket={websocket}
      validDeadline={injectionDeadlineValid}
    />);
  })

  if(!(injectionDeadlineValid) && (availableInjectionTracers.length)) {
    InjectionOrderCards.push(<InjectionOrderCard
                                key={-1}
                                injectionOrder={{
                                  delivery_time : "",
                                  delivery_date : activeDateString,
                                  injections : "",
                                  status : 0,
                                  tracer_usage : INJECTION_USAGE.human,
                                  comment : "",
                                  ordered_by : null,
                                  endpoint : active_endpoint,
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
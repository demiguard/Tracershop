import React, { useState } from "react";
import { Row, Col, Button } from "react-bootstrap";

import { INJECTION_USAGE, ORDER_STATUS } from "~/lib/constants";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";

import { dateToDateString } from "~/lib/formatting";

import SiteStyles from '~/css/Site.module.css'
import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCard } from "./shop_injectables/time_slot_card";
import { getDay } from "~/lib/chronomancy";
import { useTracershopState } from "../tracer_shop_context";
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
export function OrderReview({active_endpoint,
                             active_customer,
                             active_date,
                             injectionDeadlineValid,
                             activityDeadlineValid,
}){
  const state = useTracershopState();

  const tracerCatalog = new TracerCatalog(state.tracer_mapping, state.tracer);
  const availableActivityTracers = tracerCatalog.getActivityCatalog(active_endpoint);
  const availableInjectionTracers = tracerCatalog.getInjectionCatalog(active_endpoint);

  // State Definitions
  let activeTracerInit = -1;
  if (0 < availableActivityTracers.length){
    activeTracerInit = availableActivityTracers[0].id;
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
      activityDeadlineValid={activityDeadlineValid}
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
      injection_order={injectionOrder}
      injection_tracers = {availableInjectionTracers}
      valid_deadline={injectionDeadlineValid}
    />);
  })

  if(injectionDeadlineValid && (availableInjectionTracers.length > 0)) {
    InjectionOrderCards.push(<InjectionOrderCard
                                key={-1}
                                injection_order={new InjectionOrder(
                                  -1,
                                  "", // Delivery TIme
                                  activeDateString, //
                                  "", // injections
                                  ORDER_STATUS.AVAILABLE, // Status
                                  INJECTION_USAGE.human, // tracer_usage
                                  "", // comment
                                  null, // ordered_by
                                  active_endpoint, // endpoint
                                  availableInjectionTracers[0].id, // tracer
                                  null, null , null)}
                                injection_tracers = {availableInjectionTracers}
                                valid_deadline={injectionDeadlineValid}
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
import React, { useState } from "react";
import { Row, Col, Button } from "react-bootstrap";

import { DATABASE_ACTIVE_TRACER, INJECTION_USAGE, ORDER_STATUS } from "~/lib/constants";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";

import { dateToDateString } from "~/lib/formatting";

import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCard } from "./shop_injectables/time_slot_card";
import { getDay } from "~/lib/chronomancy";
import { useTracershopState } from "../../contexts/tracer_shop_context";
import { TracerCatalog } from '~/contexts/tracerCatalog';
import { getRelevantActivityOrders } from "~/lib/filters";
import { Optional } from "~/components/injectable/optional";
import { DeadlineDisplay } from "~/components/injectable/deadline_display";
import { db } from "~/lib/local_storage_driver";
import { MARGIN } from "~/lib/styles";
import { useTracerCatalog } from "~/contexts/tracerCatalog";


/**
 * This object is the manual ordering and review for activity based orders
 * @param {{
 *  active_date : Date,
 *  active_endpoint : Number,
 *  activityDeadlineValid : Boolean,
 *  injectionDeadlineValid : Boolean,
 *  booking : Array<Booking>
 * }} props
 * @returns Element
 */
export function OrderReview({active_endpoint,
                             active_customer,
                             active_date,
                             injectionDeadlineValid,
                             activityDeadlineValid,
                             activeTracer,
                             setActiveTracer
}){
  const state = useTracershopState();
  const tracerCatalog = useTracerCatalog();
  const availableActivityTracers  = tracerCatalog.getActivityCatalog(active_endpoint);
  const availableInjectionTracers = tracerCatalog.getInjectionCatalog(active_endpoint);
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
      db.set(DATABASE_ACTIVE_TRACER, tracer.id);
      setActiveTracer(tracer.id);
    }
  }

  const tracerButtons = availableActivityTracers.map((tracer) => {
    const underline = tracer.id === activeTracer;

    return (<Button
      style={MARGIN.leftRight.px15}
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
    (injectionOrder) => {
      const matchingDay = injectionOrder.delivery_date === activeDateString;
      const matchingEndpoint = injectionOrder.endpoint === active_endpoint;
      return matchingDay && matchingEndpoint;
  });

  const InjectionOrderCards = relevantInjectionOrders.map((injectionOrder) => {
    return (<InjectionOrderCard
      key={injectionOrder.id}
      injection_order={injectionOrder}
      injection_tracers = {availableInjectionTracers}
      valid_deadline={injectionDeadlineValid}
    />);
  });

  const /**@type {ServerConfiguration | undefined} */ serverConfig = state.server_config.get(1);
  const /**@type {Deadline | undefined} */ activityDeadline = (serverConfig !== undefined) ?
                                                                  state.deadline.get(serverConfig.global_activity_deadline)
                                                                  : undefined;
  const /**@type {Deadline | undefined} */ injectionDeadline = (serverConfig !== undefined) ?
                                                                   state.deadline.get(serverConfig.global_injection_deadline)
                                                                   : undefined;

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
    <Row>
      <Col>
        <DeadlineDisplay
          deadline_name="aktivites ordre"
          deadline={activityDeadline}
        />
      </Col>
      <Col>
        <DeadlineDisplay
          deadline_name="injektions ordre"
          deadline={injectionDeadline}
        />
      </Col>
    </Row>
    <Row style={{margin : '15px'}}>
      <Col>{tracerButtons}</Col>
    </Row>
    <Row>
      {activeTracer !== -1 ? timeSlotsCards : <h3>
        Der ikke valgt en aktivitets tracer, klik på en af dem for at bestille den.
      </h3>}
    </Row>
    <Optional exists={!!(InjectionOrderCards.length)}>
      <Row style={{margin : '15px'}}><h3>Injection Ordre</h3></Row>
      <Row>{InjectionOrderCards}</Row>
    </Optional>
  </Row>);
}
import React, { useRef } from "react";
import { Row, Col, Button } from "react-bootstrap";

import { DATABASE_ACTIVE_TRACER, INJECTION_USAGE, ORDER_STATUS } from "~/lib/constants";
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { dateToDateString } from "~/lib/formatting";
import { InjectionOrderCard } from "./shop_injectables/injection_order_card";
import { TimeSlotCardActivity } from "./shop_injectables/time_slot_card_activity";
import { getDay } from "~/lib/chronomancy";
import { useTracershopState } from "../../contexts/tracer_shop_context";
import { activityOrderFilter, timeSlotFilter } from "~/lib/filters";
import { Optional } from "~/components/injectable/optional";
import { DeadlineDisplay } from "~/components/injectable/deadline_display";
import { db } from "~/lib/local_storage_driver";
import { MARGIN } from "~/lib/styles";
import { useTracerCatalog } from "~/contexts/tracer_catalog";
import { PRODUCT_TYPES, ProductReference } from "~/dataclasses/references/product_reference";
import { presentName } from "~/lib/presentation";
import { TimeSlotCard } from "~/components/shop_pages/shop_injectables/time_slot_card";
import { makeBlankInjectionOrder, makeBlankTracer } from "~/lib/blanks";
import { getObjects } from "~/lib/utils";


/**
 * This object is the manual ordering and review for activity based orders
 * @param {{
 *  active_date : Date,
 *  active_endpoint : Number,
 *  activityDeadlineValid : Boolean,
 *  injectionDeadlineValid : Boolean,
 *  booking : Array<Booking>,
 *  productState : [ProductReference, React.SetStateAction<ProductReference>]
 * }} props
 * @returns Element
 */
export function OrderReview({active_endpoint,
                             active_customer,
                             active_date,
                             injectionDeadlineValid,
                             activityDeadlineValid,
                             productState,
}){
  const state = useTracershopState();
  const tracerCatalog = useTracerCatalog();
  const endpoint = state.delivery_endpoint.get(active_endpoint);
  const endpointCatalog = tracerCatalog.getCatalog(active_endpoint);

  const [product, setActiveProduct] = productState;
  const availableTracers = [...endpointCatalog.tracerCatalogActivity].map(getObjects(state.tracer))
  const availableIsotopes = [...endpointCatalog.isotopeCatalog].map(getObjects(state.isotopes))
  const availableInjectionTracers = [...endpointCatalog.tracerCatalogInjections].map(getObjects(state.tracer));
  const availableProducts = [...availableTracers, ...availableIsotopes];


  const day = getDay(active_date);
  const activeDateString = dateToDateString(active_date);

  const availableDeliveries = product.filterDeliveries(state, {
    endpoint_id : active_endpoint, day : day
  });

  const availableOrders = product.filterOrders(state, {
    timeslots : availableDeliveries,
    delivery_date : activeDateString
  });


  function setProduct(tracer){
    return () => {
      setActiveProduct(tracer);
    }
  }

  const tracerButtons = availableProducts.map((product_) => {
    const productRef = ProductReference.fromProduct(product_)
    const underline = product.equal(productRef)

    return (<Button
      style={MARGIN.leftRight.px15}
      key={productRef.to_value()}
      onClick={setProduct(product_)}
      sz="sm"
    >
      {underline ? <u>{presentName(product_)}</u> : presentName(product_)}
    </Button>)
  })

  const overhead = tracerCatalog.getOverheadForTracer(active_customer, product.product_id);

  const timeSlotsCards = availableDeliveries.map((timeSlot) => {
    return <TimeSlotCard
      key={timeSlot.id}
      type={product.type}
      timeSlot={timeSlot}
      orders={availableOrders}
      overhead={overhead}
      deadlineValid={activityDeadlineValid}
    />;
  });

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
      injection_tracers={availableInjectionTracers}
      valid_deadline={injectionDeadlineValid}
    />);
  });

  const serverConfig = state.server_config.get(1);
  const activityDeadline = (serverConfig !== undefined) ?
      state.deadline.get(serverConfig.global_activity_deadline)
    : undefined;
  const injectionDeadline = (serverConfig !== undefined) ?
      state.deadline.get(serverConfig.global_injection_deadline)
    : undefined;

  const defaultInjectionTracer = availableInjectionTracers.length ?
      availableInjectionTracers[0]
    : makeBlankTracer();


  const blankInjectionOrder = makeBlankInjectionOrder(endpoint, defaultInjectionTracer)

  if(injectionDeadlineValid && (availableInjectionTracers.length > 0)) {
    InjectionOrderCards.push(<InjectionOrderCard
                                key={-1}
                                injection_order={blankInjectionOrder}
                                injection_tracers = {availableInjectionTracers}
                                valid_deadline={injectionDeadlineValid}
                              />);
  }

  return (
  <Row>
    <Row>Ordre for den. {active_date.toLocaleDateString("da")}</Row>
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
      {product.type !== PRODUCT_TYPES.EMPTY ? timeSlotsCards : <h3>
        Der ikke valgt en aktivitets tracer, klik på en af dem for at bestille den.
      </h3>}
    </Row>
    <Optional exists={!!(InjectionOrderCards.length)}>
      <Row style={{margin : '15px'}}><h3>Injection Ordre</h3></Row>
      <Row>{InjectionOrderCards}</Row>
    </Optional>
  </Row>);
}
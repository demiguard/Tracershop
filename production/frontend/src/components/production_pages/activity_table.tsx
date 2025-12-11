
import React, { useMemo, useState } from "react";
import { Row, Col, Button, Container } from 'react-bootstrap'
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting";
import { ActivityModal } from "../modals/activity_modal";
import { CreateOrderModal } from "../modals/create_activity_modal";
import {PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER,
  PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING,
  PROP_TRACER_CATALOG,  DAYS_OBJECTS
} from "~/lib/constants";

import { getDay } from "~/lib/chronomancy";
import { ProductionTimeSlotOwnerShip, TimeSlotMapping } from "~/lib/data_structures";
import { OrderMapping } from "~/lib/data_structures/order_mapping";

import { productionsFilter } from "~/lib/filters";
import { useTracershopState } from "../../contexts/tracer_shop_context";
import { Optional } from "../injectable/optional";
import { ProductionActivityTimeSlot } from "~/components/production_pages/production_injectables/production_activity_time_slot";
import { useTracerCatalog } from "~/contexts/tracer_catalog";
import { ProductionRow } from "./production_injectables/production_row";
import { sortTimeSlots } from "~/lib/sorting";

const Modals = {
  create_modal : CreateOrderModal,
  activityModal : ActivityModal,
}

type ActivityTableProps = {
  active_tracer : number
}

//#region Activity table
/** This is the main row block of content
 */
export function ActivityTable ({active_tracer} : ActivityTableProps) {
  const state = useTracershopState();
  const tracer = state.tracer.get(active_tracer);
  const activeDay = getDay(state.today)
  const delivery_date = dateToDateString(state.today)
  const danishDateString = parseDateToDanishDate(delivery_date);
  const relevantProductions = useMemo(
    () => productionsFilter(state.production, { day : activeDay, tracerID : active_tracer}, true),
    [state.production, state.today, active_tracer]
  )

  const timeSlotMapping = useMemo(() => new TimeSlotMapping(
    state.delivery_endpoint,
    state.deliver_times,
    relevantProductions,
  ), [state.delivery_endpoint, state.deliver_times, relevantProductions]);

  const productionTimeSlotOwnerShip = useMemo(() => new ProductionTimeSlotOwnerShip(
    relevantProductions,
    state.deliver_times
  ), [relevantProductions, state.deliver_times]);

  const tracerCatalog = useTracerCatalog();

  const [modalIdentifier, setModalIdentifier] = useState(null);
  const [timeSlotID, setTimeSlotID] = useState(null);


  // Order Filtering
  const orderMapping = useMemo(() => {
    return new OrderMapping (state.activity_orders);
  }, [state.activity_orders])

  const productionRows: React.ReactElement[] = [];
  for(const productionID of relevantProductions){
    productionRows.push(
      <ProductionRow
        key={productionID}
        active_production={productionID}
        productionTimeSlotOwnerShip={productionTimeSlotOwnerShip}
        orderMapping={orderMapping}
      />);
  }

  const todays_order_mapping = orderMapping.get_daily_orders(delivery_date);

  const timeSlotArgs = [];
  for (const [timeSlotID, orders] of todays_order_mapping){
    const deliveringTimeSlot = state.deliver_times.get(timeSlotID);
    if(!relevantProductions.includes(deliveringTimeSlot.production_run)){
      continue;
    }

    timeSlotArgs.push({
      orders : orders,
      key : timeSlotID,
      timeSlot : deliveringTimeSlot,
      orderMapping : orderMapping,
      timeSlotMapping : timeSlotMapping,
      setTimeSlotID : setTimeSlotID,
      setModalIdentifier : setModalIdentifier
    });
  }


  timeSlotArgs.sort((a, b) => {
    const func = sortTimeSlots(state.delivery_endpoint);
    return func(a.timeSlot, b.timeSlot);
  });

  const renderedTimeSlots = timeSlotArgs.map((args) => <ProductionActivityTimeSlot {...args}/>);
  const modalProps = {
    [PROP_ACTIVE_TRACER] : active_tracer,
    [PROP_ACTIVE_DATE] : state.today,
    [PROP_ON_CLOSE] : () => {
      setModalIdentifier(null)
      setTimeSlotID(null)
    },
    [PROP_TIME_SLOT_ID] : timeSlotID,
    [PROP_TIME_SLOT_MAPPING] : timeSlotMapping,
    [PROP_ORDER_MAPPING] : orderMapping,
    [PROP_TRACER_CATALOG] : tracerCatalog,
  };

  let Modal = null;
  if(Modals[modalIdentifier]){
    const ModalType = Modals[modalIdentifier];
    Modal = <ModalType {...modalProps} />;
  }

  let available_days_html = <div></div>;
  if(productionRows.length === 0 && active_tracer != -1){
    const weekly_productions = productionsFilter(state, {tracerID : active_tracer});
    const production_days = new Set();
    for(const production of weekly_productions){
      production_days.add(production.production_day);
    }
    const available_days =  [...production_days]
      .sort((a: number,b: number) => a - b)
      .map((day : number) => DAYS_OBJECTS[day].name)
      .join(", ");
    if(tracer){
      available_days_html = <Row><h3>{tracer.shortname} bliver kun produceret: {available_days}</h3></Row>;
    } else {
      console.log("Active_tracer:", active_tracer)
      console.log(state)
    }
  }

  return (
    <div>
      <Container>
        <Row>
          <Col sm={10}>
            <Optional exists={!!productionRows.length} alternative={available_days_html}>
              <Row><h3>Produktioner - {danishDateString}:</h3></Row>
              <div>
                {productionRows}
              </div>
            </Optional>
          </Col>
          <Col sm={2}>
            <Button
              name="create-order"
              onClick={() => {setModalIdentifier("create_modal")}}>Opret ny ordre</Button>
          </Col>
        </Row>
      </Container>
      <Container>
        {renderedTimeSlots}
      </Container>
      { modalIdentifier != null ? Modal : null}
    </div>
  );
}

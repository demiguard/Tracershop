
import React, { useState } from "react";
import { Row, Col, Button, Container } from 'react-bootstrap'
import { dateToDateString, parseDateToDanishDate } from "../../lib/formatting.js";
import { calculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";
import propTypes from 'prop-types'


import {PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER,
  PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING,
  PROP_TRACER_CATALOG,  DAYS_OBJECTS
} from "../../lib/constants.js";

import { ActivityProduction } from "../../dataclasses/dataclasses.js";
import { compareTimeStamp, getDay
  } from "../../lib/chronomancy.js";
import { ProductionTimeSlotOwnerShip, TimeSlotMapping,
  getTimeSlotOwner} from "../../lib/data_structures.js";
import { OrderMapping } from "~/lib/data_structures/order_mapping.js";

import { applyFilter, dailyActivityOrderFilter, productionsFilter } from "../../lib/filters.js";
import { useTracershopState } from "../../contexts/tracer_shop_context.js";
import { Optional } from "../injectable/optional.js";
import { ProductionTimeSlot } from "~/components/injectable/production_injectionable/production_time_slot.js";
import { useTracerCatalog } from "~/effects/tracerCatalog.js";

const Modals = {
  create_modal : CreateOrderModal,
  activityModal : ActivityModal,
}

//#region Production Row
/**
 * Row over the actual table,with the goal of informing the user of how much
 * tracer needs to be produced
 * @param {object} props
 * @param {Number} props.active_production - Id of the Production to be rendered
 * @param {ProductionTimeSlotOwnerShip} props.productionTimeSlotOwnerShip - Data structure
 * @param {OrderMapping} props.orderMapping
 *
 * {{
*  active_production : Number - ID of the production
*  productionTimeSlotOwnerShip : ProductionTimeSlotOwnerShip -
*  tracerCatalog : TracerCatalog - A catalog of the tracers the customers can
*  orderMapping : OrderMapping - A mapping of orders to time slots, taking into account that orders may have been moved
* }} props
* @returns
*/
function ProductionRow({active_production,
                        productionTimeSlotOwnerShip,
                        tracerCatalog,
                        orderMapping}){
  const state = useTracershopState();
  const production = state.production.get(active_production);
  const tracer = state.tracer.get(production.tracer);
  const isotope = state.isotopes.get(tracer.isotope);

  let activity_ordered = 0;
  let activity_overhead = 0;

  const /**@type {Array<Number> | undefined} */ associatedTimeSlots = productionTimeSlotOwnerShip.getTimeSlots(active_production);

  if (associatedTimeSlots !== undefined) {
    for(const timeSlot of associatedTimeSlots){
      const customer = getTimeSlotOwner(timeSlot, state.delivery_endpoint, state.customer)
      const overhead = tracerCatalog.getOverheadForTracer(customer.id, tracer.id)
      const orderCollection = orderMapping.getOrders(timeSlot.id);
      if(orderCollection !== undefined) {
        for (const order of orderCollection){
          const contributingTimeSlot = (() => {
            const id = order.moved_to_time_slot ? order.moved_to_time_slot : order.ordered_time_slot;
            return state.deliver_times.get(id);
          })();

          if(!(associatedTimeSlots.includes(contributingTimeSlot))){
            // This is indicate that the order have been moved to an other production
            // So it should not be included in the production!
            //console.log(`Order `, order, ` belongs to a time slot`, contributingTimeSlot, `that is not the production: ${associatedTimeSlots.map(getId)}`);
            continue;
          }
          const originalTimeSlot = state.deliver_times.get(order.ordered_time_slot)
          const timeDifference = compareTimeStamp(originalTimeSlot.delivery_time, production.production_time);
          const amount = calculateProduction(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

          activity_ordered += amount;
          activity_overhead += amount * overhead;
        }
      }
    }
 }

 return (
 <Row>
   <h4>
     Kørsel {production.production_time} : <strong>{Math.floor(activity_ordered)}</strong> MBq / Overhead : <strong>{Math.floor(activity_overhead)}</strong> MBq
   </h4>
 </Row>);
 }

//#region Activity table
/** This is the main row block of content
 *
 * @param {{
 *  active_tracer : Number,
 *  active_date : Date
 * }} props
 * @returns {Element}
 */
export function ActivityTable ({active_tracer, active_date}) {
  const state = useTracershopState();
  const tracer = state.tracer.get(active_tracer);
  const activeDay = getDay(active_date)
  const delivery_date = dateToDateString(active_date)
  const danishDateString = parseDateToDanishDate(delivery_date);
  const relevantProductions = productionsFilter(state, { day : activeDay, tracerID : active_tracer}, true)

  const timeSlotMapping = new TimeSlotMapping(
    state.delivery_endpoint,
    state.deliver_times,
    relevantProductions,
  );

  const productionTimeSlotOwnerShip = new ProductionTimeSlotOwnerShip(
    relevantProductions,
    state.deliver_times
  );

  const tracerCatalog = useTracerCatalog()

  const [modalIdentifier, setModalIdentifier] = useState(null);
  const [timeSlotID, setTimeSlotID] = useState(null);

  // Order Filtering
  const todays_orders = applyFilter(state.activity_orders,
                                    dailyActivityOrderFilter(state.deliver_times,
                                                             state.production,
                                                             delivery_date,
                                                             active_tracer));


  const orderMapping = new OrderMapping(todays_orders,
                                        delivery_date,
                                        tracerCatalog,
                                        active_tracer,
                                        state);

  const productionRows = relevantProductions.map((productionID) => {
    return (<ProductionRow
      key={productionID}
      active_production={productionID}
      productionTimeSlotOwnerShip={productionTimeSlotOwnerShip}
      tracerCatalog={tracerCatalog}
      orderMapping={orderMapping}
    />);
  })

  const renderedTimeSlots = [];
  for (const orderCollection of orderMapping){
      renderedTimeSlots.push(<ProductionTimeSlot
                orderCollection={orderCollection}
                key={orderCollection.delivering_time_slot.id}
                timeSlot = {orderCollection.delivering_time_slot}
                orderMapping={orderMapping}
                timeSlotMapping={timeSlotMapping}
                setTimeSlotID={setTimeSlotID}
                setModalIdentifier={setModalIdentifier}
             />);
  }

  const modalProps = {
    [PROP_ACTIVE_TRACER] : active_tracer,
    [PROP_ACTIVE_DATE] : active_date,
    [PROP_ORDER_MAPPING] : timeSlotMapping,
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
    const /**@type {ActivityProduction[]} */ weekly_productions = productionsFilter(state, {tracerID : active_tracer});
    const /**@type {Set<Number>} */ production_days = new Set();
    for(const production of weekly_productions){
      production_days.add(production.production_day);
    }
    const available_days =  [...production_days]
      .sort((a,b) => a - b)
      .map((day) => DAYS_OBJECTS[day].name)
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
              {productionRows}
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

ActivityTable.propType = {
  [PROP_ACTIVE_TRACER] : propTypes.number.isRequired,
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}
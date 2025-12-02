import React from 'react'

import { Row } from "react-bootstrap";
import { useTracerCatalog } from '~/contexts/tracer_catalog';
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { compareTimeStamp } from "~/lib/chronomancy";
import { getTimeSlotOwner, ProductionTimeSlotOwnerShip } from "~/lib/data_structures";
import { OrderMapping } from '~/lib/data_structures/order_mapping';
import { dateToDateString } from '~/lib/formatting';
import { decayCorrect } from "~/lib/physics";


type ProductionRowProps = {
  orderMapping : OrderMapping,
  active_production : number,
  productionTimeSlotOwnerShip : ProductionTimeSlotOwnerShip
}

/**
 * Row over the actual table,with the goal of informing the user of how much
 * tracer needs to be produced

 *

*/
export function ProductionRow({
  active_production,
  productionTimeSlotOwnerShip,
  orderMapping
} :  ProductionRowProps){
  const state = useTracershopState();
  const dateString = dateToDateString(state.today)
  const production = state.production.get(active_production);
  const tracer = state.tracer.get(production.tracer);
  const isotope = state.isotopes.get(tracer.isotope);

  const tracerCatalog = useTracerCatalog();

  let activity_ordered = 0;
  let activity_overhead = 0;

  const associatedTimeSlots = productionTimeSlotOwnerShip.getTimeSlots(active_production);

  for(const timeSlot of associatedTimeSlots){
    const customer = getTimeSlotOwner(timeSlot, state.delivery_endpoint, state.customer)
    const overhead = tracerCatalog.getOverheadForTracer(customer.id, tracer.id)
    const orders = orderMapping.getOrders(dateString,timeSlot.id);

    for (const order of orders){
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
      const amount = decayCorrect(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

      activity_ordered += amount;
      activity_overhead += amount * overhead;
    }
  }

 return (
  <Row>
    <h4>
      Kørsel {production.production_time} : <strong>{Math.floor(activity_ordered)}</strong> MBq / Overhead : <strong>{Math.floor(activity_overhead)}</strong> MBq
   </h4>
  </Row>);
 }

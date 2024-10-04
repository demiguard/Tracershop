import React from 'react';
import { Calender } from '../calender';
import { useTracershopState} from '~/components/tracer_shop_context';
import { ProductionBitChain } from '~/lib/data_structures';
import { toMapping } from '~/lib/utils';
import { productionsFilter, timeSlotsFilter } from '~/lib/filters';


/**
 *
 * @param {{
 * active_date : Date,
 * on_day_click : Function
 * }} param0
 * @returns
 */
export function ProductionCalender({active_date, on_day_click, activeTracer}){
  const state = useTracershopState()

  const productions = 0 < activeTracer ? toMapping(productionsFilter(state, {tracerID : activeTracer})) :
    state.production

  const bitChain = new ProductionBitChain(productions);


  const filter_activity_function = (() => {
    if(activeTracer <= 0){
      return () => true;
    }
    const timeSlots = timeSlotsFilter(
      state, {state : state, tracerID : activeTracer}, true
    )
    return (activityOrder) => timeSlots.includes(activityOrder.ordered_time_slot)
  })()

  return <Calender
    calender_date={active_date}
    calender_on_day_click={on_day_click}
    filter_activity_orders={filter_activity_function}
    filter_injection_orders={() => true}
    bit_chain={bitChain}
  />
}

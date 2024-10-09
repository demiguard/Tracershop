import React from 'react';
import { Calender } from '../calender';
import { useTracershopState} from '~/components/tracer_shop_context';
import { ProductionBitChain } from '~/lib/data_structures';

/**
 *
 * @param {{
 * active_date : Date,
 * on_day_click : Function
 * }} param0
 * @returns
 */
export function ProductionCalender({active_date, on_day_click, activeTracer}){
  const state = useTracershopState();
  const bitChain = new ProductionBitChain(state.production);

  return <Calender
    calender_date={active_date}
    calender_on_day_click={on_day_click}
    filter_activity_orders={() => true}
    filter_injection_orders={() => true}
    bit_chain={bitChain}
  />;
}

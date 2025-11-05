import React from 'react';
import { Calender } from '../calender';
import { useTracershopState} from '~/contexts/tracer_shop_context';
import { ProductionBitChain } from '~/lib/data_structures/bit_chains';

/**
 *
 * @param {{
 *   on_day_click : Function
 * }} param0
 * @returns
 */
export function ProductionCalender({on_day_click}){
  const state = useTracershopState();
  const bitChain = new ProductionBitChain(state.production);

  return <Calender
    calender_date={state.today}
    calender_on_day_click={on_day_click}
    filter_activity_orders={() => true}
    filter_injection_orders={() => true}
    bit_chain={bitChain}
  />;
}

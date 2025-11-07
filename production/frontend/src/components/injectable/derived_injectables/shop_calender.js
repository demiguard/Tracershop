import React from 'react'
import propTypes from 'prop-types';

import { Calender } from '../calender'
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { getId } from '~/lib/utils';
import { TimeSlotBitChain } from '~/lib/data_structures/bit_chains';

/**
 *
 * @param {{
 *  time_slots : Array<Number>
 * }} param0
 * @returns
 */
export function ShopCalender({ on_day_click, active_endpoint, time_slots }){
  const state = useTracershopState();
  const bitChain = new TimeSlotBitChain(time_slots, state);
  const timeSlotIDs = time_slots.map(getId);

  console.log(time_slots)

  return <Calender
    calender_date={state.today}
    calender_on_day_click={on_day_click}
    filter_activity_orders={(ao) => timeSlotIDs.includes(ao.ordered_time_slot)}
    filter_injection_orders={(io) => io.endpoint === active_endpoint}
    bit_chain={bitChain}
  />
}

ShopCalender.propTypes = {
  on_day_click : propTypes.func.isRequired,
  time_slots : propTypes.arrayOf(Number).isRequired,
}
import React from 'react'
import propTypes from 'prop-types';

import { Calender } from '../calender'
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { TimeSlotBitChain } from '~/lib/data_structures';

import { getId } from '~/lib/utils';

/**
 *
 * @param {{
 *  time_slots : Array<Number>
 * }} param0
 * @returns
 */
export function ShopCalender({active_date, on_day_click, active_endpoint, time_slots}){
  const state = useTracershopState();
  const bitChain = new TimeSlotBitChain(time_slots, state.production)
  const timeSlotIDs = time_slots.map(getId);

  return <Calender
    calender_date={active_date}
    calender_on_day_click={on_day_click}
    filter_activity_orders={(ao) => timeSlotIDs.includes(ao.ordered_time_slot)}
    filter_injection_orders={(io) => io.endpoint === active_endpoint}
    bit_chain={bitChain}
  />
}

ShopCalender.propTypes = {
  active_date : propTypes.objectOf(Date).isRequired,
  on_day_click : propTypes.func.isRequired,
  time_slots : propTypes.arrayOf(Number).isRequired,
}
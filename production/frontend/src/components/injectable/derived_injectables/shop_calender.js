import React from 'react'
import propTypes from 'prop-types';

import { Calender, STATUS_COLORS } from '../calender'
import { useTracershopState } from '~/components/tracer_shop_context'
import { OrderDateMapping, TimeSlotBitChain } from '~/lib/data_structures';
import { ORDER_STATUS } from '~/lib/constants';
import { expiredDeadline } from '~/lib/chronomancy';
import { ActivityDeliveryTimeSlot, ActivityOrder, InjectionOrder } from '~/dataclasses/dataclasses';

export function ShopCalender({active_date, on_day_click, activity_orders, injection_orders, time_slots}){
  const state = useTracershopState();
  const server_config = state.server_config.get(1)
  const activity_deadline = (server_config !== undefined) ?
    state.deadline.get(server_config.global_activity_deadline) : undefined;

  let injection_deadline = (server_config !== undefined) ?
    state.deadline.get(server_config.global_injection_deadline) : undefined;


  const closedDateSet = new Set();
  for(const closed_date of state.closed_date.values()){
    closedDateSet.add(closed_date.close_date) // Change this to a keyword
  }

  const dateActivityMapping = new OrderDateMapping(activity_orders)
  const dateInjectionMapping = new OrderDateMapping(injection_orders)

  const bitChain = new TimeSlotBitChain(time_slots, state.production)


  function get_color(dateString){
    let activity_color_id = ORDER_STATUS.UNAVAILABLE;
    let injection_color_id = ORDER_STATUS.UNAVAILABLE;

    const date = new Date(dateString);

    if(bitChain.eval(date) && !expiredDeadline(activity_deadline, date)){
      activity_color_id = ORDER_STATUS.AVAILABLE;
    }

    if(!expiredDeadline(injection_deadline, date)){
      activity_color_id = ORDER_STATUS.AVAILABLE;
    }

    if(dateActivityMapping.has_status_for_date(dateString)){
      activity_color_id = dateActivityMapping.get_status_for_date(dateString);
    }

    if(dateInjectionMapping.has_status_for_date(dateString)){
      injection_color_id = dateInjectionMapping.get_status_for_date(dateString);
    }

    return [STATUS_COLORS[activity_color_id], STATUS_COLORS[injection_color_id]]
  }

  return <Calender
    calender_date={active_date}
    calender_get_color={get_color}
    calender_on_day_click={on_day_click}
  />
}

ShopCalender.propTypes = {
  active_date : propTypes.objectOf(Date).isRequired,
  on_day_click : propTypes.func.isRequired,
  activity_orders : propTypes.arrayOf(propTypes.instanceOf(ActivityOrder)).isRequired,
  injection_orders : propTypes.arrayOf(propTypes.instanceOf(InjectionOrder)).isRequired,
  time_slots : propTypes.arrayOf(propTypes.instanceOf(ActivityDeliveryTimeSlot)).isRequired,
}
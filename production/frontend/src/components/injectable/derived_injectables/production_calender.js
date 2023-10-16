import React, { useState } from 'react';
import { Calender, STATUS_COLORS } from '../calender';
import { useTracershopState, useWebsocket } from '~/components/tracer_shop_context';
import { calculateDeadline, expiredDeadline, getBitChain, getDay } from '~/lib/chronomancy';
import { OrderDateMapping, ProductionBitChain } from '~/lib/data_structures';
import { ORDER_STATUS } from '~/lib/constants';


export function ProductionCalender({active_date, on_day_click}){
  const state = useTracershopState()

  const closedDateSet = new Set();
  for(const closed_date of state.closed_date.values()){
    closedDateSet.add(closed_date.closed_date) // Change this to a keyword
  }

  const server_config = state.server_config.get(1)
  const activity_deadline = (server_config !== undefined) ?
    state.deadline.get(server_config.global_activity_deadline) : undefined;

  let injection_deadline = (server_config !== undefined) ?
    state.deadline.get(server_config.global_injection_deadline) : undefined;

  const dateActivityMapping = new OrderDateMapping([...state.activity_orders.values()])
  const dateInjectionMapping = new OrderDateMapping([...state.injection_orders.values()])

  const productionBitChain = new ProductionBitChain(state.production)

  function get_color(dateString){
    if(closedDateSet.has(dateString)){
      return [STATUS_COLORS[ORDER_STATUS.UNAVAILABLE],
              STATUS_COLORS[ORDER_STATUS.UNAVAILABLE]];
    }

    const date = new Date(dateString);

    // Default Closed
    let activity_color_id =  ORDER_STATUS.UNAVAILABLE;
    let injection_color_id = ORDER_STATUS.UNAVAILABLE;

    if (productionBitChain.eval(date) && !expiredDeadline(activity_deadline, date)){
      activity_color_id = ORDER_STATUS.AVAILABLE;
    }

    if (!expiredDeadline(injection_deadline, date)){
      injection_color_id = ORDER_STATUS.AVAILABLE;
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


import React, { useState } from 'react';
import { Calender, STATUS_COLORS } from '../calender';
import { useTracershopState, useWebsocket } from '~/components/tracer_shop_context';
import { FirstSundayInNextMonth, LastMondayInLastMonth, calculateDeadline, expiredDeadline, getBitChain, getDay } from '~/lib/chronomancy';
import { OrderDateMapping, ProductionBitChain } from '~/lib/data_structures';
import { ORDER_STATUS } from '~/lib/constants';
import { compareDates } from '~/lib/utils';
import { dateToDateString } from '~/lib/formatting';


/**
 * 
 * @param {{
 * active_date : Date,
 * on_day_click : Function
 * }} param0 
 * @returns 
 */
export function ProductionCalender({active_date, on_day_click}){
  const state = useTracershopState()

  const bitChain = new ProductionBitChain(state.production);

  return <Calender
    calender_date={active_date}
    calender_on_day_click={on_day_click}
    filter_activity_orders={() => true}
    filter_injection_orders={() => true}
    bit_chain={bitChain}
  />
}


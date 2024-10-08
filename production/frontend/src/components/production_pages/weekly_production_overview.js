import React from 'react'
import { useTracershopState } from '~/components/tracer_shop_context'
import { InjectionOrder } from '~/dataclasses/dataclasses';
import { getDateRangeForWeek } from '~/lib/chronomancy';
import { activityOrdersFilter, injectionOrdersFilter } from '~/lib/filters';

export function WeeklyProductionOverview({active_date}){
  const state = useTracershopState();

  const weeklyRange = getDateRangeForWeek(active_date)

  const /** @type {Array<InjectionOrder>} */ activityOrders = activityOrdersFilter(state, {
    dateRange : weeklyRange,
    state : state
  });

  const /** @type {Array<InjectionOrder>} */ injectionOrders = injectionOrdersFilter(state, {
    state : state, dateRange : weeklyRange
  });

  return (
    <div></div>
  )
}
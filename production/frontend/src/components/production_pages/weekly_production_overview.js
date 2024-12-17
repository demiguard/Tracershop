import React from 'react'
import { RowMajorTimeTable, TimeTable } from '~/components/injectable/time_table';
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { datify, getDateRangeForWeek } from '~/lib/chronomancy';
import { WeeklyOrderOverview } from '~/lib/data_structures';

export function WeeklyProductionOverview({active_date}){
  const date_ = datify(active_date)
  const state = useTracershopState();

  const weeklyRange = getDateRangeForWeek(date_);

  const orderOverviewDataStructure = new WeeklyOrderOverview(state, weeklyRange)

  return (
    <RowMajorTimeTable
      timeTableDataContainer={orderOverviewDataStructure}
    />
  )
}
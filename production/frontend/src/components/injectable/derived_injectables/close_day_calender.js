import React, { useState } from 'react'

import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, ORDER_STATUS } from "~/lib/constants";
import { DATA_CLOSED_DATE } from "~/lib/shared_constants";
import { Calender, STATUS_COLORS } from "../../injectable/calender";

import { dateToDateString } from "~/lib/formatting.js";
import { ClosedDate } from "~/dataclasses/dataclasses";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { ProductionBitChain } from '~/lib/data_structures';

export function CloseDayCalender(){
  const [activeDate, _] = useState(new Date())
  const closedDateMap = new Map();
  const websocket = useWebsocket();
  const state = useTracershopState();
  const productionBitChain = new ProductionBitChain(state.production);

  for(const closedDate of state.closed_date.values()){
    closedDateMap.set(closedDate.close_date, closedDate.id);
  }

  function changeCloseDay (dateObject) {
    const dateStr = dateToDateString(dateObject)
    if (closedDateMap.has(dateStr)){
      const closedDateID = closedDateMap.get(dateStr);
      websocket.sendDeleteModel(DATA_CLOSED_DATE, [closedDateID])
    } else { // Delete it
      const newClosedDate = new ClosedDate(undefined, dateStr);
      websocket.sendCreateModel(DATA_CLOSED_DATE, newClosedDate)
    }
  }

  return <Calender
    calender_date={activeDate}
    calender_on_day_click={changeCloseDay}
    filter_activity_orders={() => true}
    filter_injection_orders={() => true}
    bit_chain={productionBitChain}
  />

}
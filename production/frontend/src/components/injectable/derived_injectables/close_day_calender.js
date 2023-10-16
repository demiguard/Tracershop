import React from 'react'

import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, ORDER_STATUS } from "~/lib/constants";
import { DATA_CLOSED_DATE } from "~/lib/shared_constants";
import { Calender, STATUS_COLORS } from "../../injectable/calender";

import { dateToDateString } from "~/lib/formatting.js";
import { ClosedDate } from "~/dataclasses/dataclasses";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";

const CLOSED_COLORS = [STATUS_COLORS[ORDER_STATUS.UNAVAILABLE],STATUS_COLORS[ORDER_STATUS.UNAVAILABLE]]
const OPEN_COLORS = [STATUS_COLORS[ORDER_STATUS.AVAILABLE],STATUS_COLORS[ORDER_STATUS.AVAILABLE]]

export function CloseDayCalender(){
  const closedDateMap = new Map();
  const websocket = useWebsocket();
  const state = useTracershopState();

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
  const calenderProps = {
    [CALENDER_PROP_DATE] : new Date(),
    [CALENDER_PROP_GET_COLOR] : (dateString) => {
      return (closedDateMap.has(dateString)) ? CLOSED_COLORS : OPEN_COLORS;
    },
    [CALENDER_PROP_ON_DAY_CLICK] : changeCloseDay,
  };

  return <Calender {...calenderProps}/>

}
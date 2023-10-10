/** This is the page, where a production admin can create a closed day */
import React from "react";

import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE } from "~/lib/constants";
import { DATA_CLOSED_DATE } from "~/lib/shared_constants";
import { Calender, productionGetMonthlyOrders } from "../../injectable/calender";

import { dateToDateString } from "~/lib/formatting.js";
import { ClosedDate } from "~/dataclasses/dataclasses";
import { useWebsocket } from "~/components/tracer_shop_context";

export function CloseDaysPage (props) {
  const closedDateMap = new Map();
  const websocket = useWebsocket()

  for(const [_BDID, _closedDate] of props[DATA_CLOSED_DATE]){
    const /**@type {ClosedDate} */ closedDate = _closedDate;
    closedDateMap.set(closedDate.close_date, closedDate.id);
  }

  function changeCloseDay (dateObject) {
    const dateStr = dateToDateString(dateObject)
    if (closedDateMap.has(dateStr)){
      const closedDateID = closedDateMap.get(dateStr);
      websocket.sendDeleteModel(DATA_CLOSED_DATE, [closedDateID])
    } else { // Delete it
      const newClosedDate = new ClosedDate(undefined, dateStr);
      websocket.sendCreateModel(DATA_CLOSED_DATE,newClosedDate)
    }
  }
  const calenderProps = {}
  calenderProps[CALENDER_PROP_DATE] = new Date();
  calenderProps[CALENDER_PROP_GET_COLOR] = (dateString) => {
    return (closedDateMap.has(dateString)) ? "date-status55" : "date-status00";
  };
  calenderProps[CALENDER_PROP_ON_DAY_CLICK] = changeCloseDay;
  calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = productionGetMonthlyOrders(websocket)

  return(
  <div>
    <Calender {...calenderProps}/>
  </div>
  );
}

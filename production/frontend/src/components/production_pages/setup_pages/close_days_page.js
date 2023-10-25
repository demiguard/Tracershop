/** This is the page, where a production admin can create a closed day */
import React, { useState } from "react";


import { CloseDayCalender } from "~/components/injectable/derived_injectables/close_day_calender";
import { ProductionCalender } from "~/components/injectable/derived_injectables/production_calender";
import { useWebsocket } from "~/components/tracer_shop_context";
import { ClosedDate } from "~/dataclasses/dataclasses";

export function CloseDaysPage () {
  const [activeDate, _] = useState(new Date())
  const websocket = useWebsocket();
  const closedDateMap = new Map();
  for(const closedDate of state.closed_date.values()){
    closedDateMap.set(closedDate.close_date, closedDate.id);
  }

  return(
  <div>
    <ProductionCalender
      active_date={activeDate}
      on_day_click={(dateObject) => {
        const dateStr = dateToDateString(dateObject)
        if (closedDateMap.has(dateStr)){
          const closedDateID = closedDateMap.get(dateStr);
          websocket.sendDeleteModel(DATA_CLOSED_DATE, [closedDateID])
        } else { // Delete it
          const newClosedDate = new ClosedDate(undefined, dateStr);
          websocket.sendCreateModel(DATA_CLOSED_DATE, newClosedDate)
        }
      }}
    />
  </div>
  );
}

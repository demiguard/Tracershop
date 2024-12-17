/** This is the page, where a production admin can create a closed day */
import React, { useState } from "react";

import { ProductionCalender } from "~/components/injectable/derived_injectables/production_calender";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { ClosedDate } from "~/dataclasses/dataclasses";
import { dateToDateString } from "~/lib/formatting";
import { DATA_CLOSED_DATE } from "~/lib/shared_constants";

export function CloseDaysPage () {
  const state = useTracershopState();
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

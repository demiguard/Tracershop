/** This is the page, where a production admin can create a closed day */
import React, { useState } from "react";
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_INJECTION_ORDER, JSON_PRODUCTION, JSON_RUN, LEGACY_KEYWORD_DDATE, PROP_WEBSOCKET, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_DELETE_DATA_CLASS } from "../../lib/constants";
import { Calender, productionGetMonthlyOrders } from "../injectable/calender";

import { FormatDateStr, dateToDateString } from "../../lib/formatting.js";
import { ClosedDate } from "../../dataclasses/dataclasses";

export function CloseDaysPage (props) {
  const [today, setToday] = useState(new Date())
  const closedDateMap = new Map();

  for(const [BDID, _closedDate] of props[JSON_CLOSED_DATE]){
    const /**@type {ClosedDate} */ closedDate = _closedDate;
    closedDateMap.set(closedDate.close_date, closedDate.id);
  }

  function changeCloseDay (dateObject, Calender) {
    const dateStr = dateToDateString(dateObject)
    if (closedDateMap.has(dateStr)){
      const closedDateID = closedDateMap.get(dateStr);
      props[PROP_WEBSOCKET].sendDeleteModel(JSON_CLOSED_DATE, [closedDateID])
    } else { // Delete it
      const newClosedDate = new ClosedDate(undefined, dateStr);
      props[PROP_WEBSOCKET].sendCreateModel(JSON_CLOSED_DATE,newClosedDate)
    }
  }
  const calenderProps = {}
  calenderProps[CALENDER_PROP_DATE] = today;
  calenderProps[CALENDER_PROP_GET_COLOR] = (dateString) => {
    return (closedDateMap.has(dateString)) ? "date-status55" : "date-status00";
  };
  calenderProps[CALENDER_PROP_ON_DAY_CLICK] = changeCloseDay;
  calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = productionGetMonthlyOrders(props[PROP_WEBSOCKET])

  return(
  <div>
    <Calender {...calenderProps}/>
  </div>
  );
}

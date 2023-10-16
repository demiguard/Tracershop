/** This is the page, where a production admin can create a closed day */
import React from "react";


import { CloseDayCalender } from "~/components/injectable/derived_injectables/close_day_calender";

export function CloseDaysPage () {
  

  return(
  <div>
    <CloseDayCalender/>
  </div>
  );
}

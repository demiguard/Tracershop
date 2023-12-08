import React from "react";
import { useTracershopState } from "../tracer_shop_context";
import { TimeTable } from "../injectable/time_table";
import { applyFilter, bookingFilter, locationEndpointFilter } from "~/lib/filters";
import { toMapping } from "~/lib/utils";
import { dateToDateString } from "~/lib/formatting";
import { TimeStamp } from "~/lib/chronomancy";

export function BookingOverview({
  active_date, active_endpoint,
}){
  const state = useTracershopState();
  const dateString = dateToDateString(active_date)
  const locations = toMapping(applyFilter(state.location,
                                          locationEndpointFilter(active_endpoint)));
  const bookings = applyFilter(state.booking, bookingFilter(dateString, state.location, active_endpoint));

  return <div>
    <TimeTable
      column_objects={locations}
      column_name_function={(location) => {
        return location.common_name ? location.common_name : location.location_code;
      }}
      floating_objects={bookings}
      floating_key_function={(booking) => {return booking.location;}}
      floating_time_stamp_function={(booking) => {return new TimeStamp(booking.start_time)}}
      inner_text_function={(booking) => {return booking.accession_number;}}

      startingHour={8}
      stoppingHour={18}
    />
  </div>;
}
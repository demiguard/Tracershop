import React from "react";
import { useTracershopState } from "../tracer_shop_context";
import { TimeTable } from "../injectable/time_table";
import { applyFilter, locationEndpointFilter, locationFilter } from "~/lib/filters";
import { toMapping } from "~/lib/utils";
import { BookingTimeGroupLocation } from "~/lib/data_structures"
import { TimeStamp } from "~/lib/chronomancy";

export function BookingOverview({
  active_date, active_endpoint, booking
}){

  const state = useTracershopState();
  const bookingTimeGroupLocation = new BookingTimeGroupLocation(
    booking, state, active_endpoint, active_date
  );

  return <div>
    <TimeTable
      TimeTableDataContainer={bookingTimeGroupLocation}
      floating_objects={booking}
      floating_key_function={(booking) => {return booking.location;}}
    />
  </div>;
}
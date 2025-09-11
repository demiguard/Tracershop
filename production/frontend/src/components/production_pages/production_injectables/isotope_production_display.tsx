import React from "react";
import { Row } from "react-bootstrap";
import { DateDisplay } from "~/components/injectable/data_displays/date_display";
import { DatetimeDisplay } from "~/components/injectable/data_displays/datetime_display";
import { MBqDisplay } from "~/components/injectable/data_displays/mbq_display";
import { TimeDisplay } from "~/components/injectable/data_displays/time_display";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeProduction } from "~/dataclasses/dataclasses";
import { getDay } from "~/lib/chronomancy";
import { isotopeDeliveryFilter, isotopeOrderFilter } from "~/lib/filters";
import { dateToDateString } from "~/lib/formatting";

type IsotopeProductionDisplayProps = {
  production : IsotopeProduction
}


export function IsotopeProductionDisplay({production}: IsotopeProductionDisplayProps){
  const state = useTracershopState();
  const day = getDay(state.today);
  const dateString = dateToDateString(state.today);

  const timeSlots = isotopeDeliveryFilter(state, {
    production_id : production.id, day : day
  })

  const orders = isotopeOrderFilter(state, {
    timeSlots : timeSlots,
    delivery_date : dateString
  });

  const toBeProducedActivity = orders.map((order) => {
    return order.ordered_activity_MBq
  }).reduce(
    (a, b) => a + b, 0
  );

  return (
    <Row>
      <h4>Kørsel: <TimeDisplay time={production.production_time}/> - <MBqDisplay activity={toBeProducedActivity}/></h4>
    </Row>
  )

}
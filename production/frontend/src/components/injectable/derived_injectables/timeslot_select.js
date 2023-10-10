/** */

import React from "react";
import { Select, toOptions, Option } from "../select";
import { PROP_ACTIVE_DATE } from "~/lib/constants";
import { DATA_TRACER, DATA_DELIVER_TIME, DATA_PRODUCTION} from "~/lib/shared_constants"
import { ActivityDeliveryTimeSlot, ActivityProduction, Tracer } from '~/dataclasses/dataclasses'
import  propTypes  from "prop-types";

export function TimeSlotSelect(props){
  const newSelectProps = {...props};
  const with_tracer = props[DATA_TRACER] !== undefined
                      && props[DATA_PRODUCTION] !== undefined;

  /** function determining the user displayed name of a timeslot
   *
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   * @returns { String }
   */
  function nameTimeSlot(timeSlot){
    if (with_tracer){
      const /**@type {ActivityProduction} */ production = props[DATA_PRODUCTION].get(timeSlot.production_run);
      const /**@type {Tracer} */ tracer = props[DATA_TRACER].get(production.tracer);
      return `${tracer.shortname} - ${timeSlot.delivery_time}`;
    }

    return timeSlot.delivery_time;
  }

  const timeSlotOptions = toOptions(props[DATA_DELIVER_TIME], nameTimeSlot, 'id')

  delete newSelectProps[DATA_DELIVER_TIME];
  delete newSelectProps[DATA_PRODUCTION];
  delete newSelectProps[DATA_TRACER];
  delete newSelectProps[PROP_ACTIVE_DATE]
  newSelectProps.options = timeSlotOptions

  return <Select
    {...newSelectProps}
  />;
};

TimeSlotSelect.propTypes = {
  [DATA_DELIVER_TIME] : propTypes.oneOfType([propTypes.instanceOf(Map), propTypes.arrayOf(ActivityDeliveryTimeSlot)])
}
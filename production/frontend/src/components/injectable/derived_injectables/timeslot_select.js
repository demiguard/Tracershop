/** */

import React from "react";
import { Select, toOptions, Option } from "../select";
import { JSON_DELIVER_TIME, JSON_PRODUCTION, JSON_TRACER, PROP_ACTIVE_DATE } from "../../../lib/constants";
import { ActivityDeliveryTimeSlot, ActivityProduction, Tracer } from '../../../dataclasses/dataclasses'

export function TimeSlotSelect(props){
  const newSelectProps = {...props};
  const with_tracer = props[JSON_TRACER] !== undefined
                      && props[JSON_PRODUCTION] !== undefined;

  /** function determining the user displayed name of a timeslot
   *
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   * @returns { String }
   */
  function nameTimeSlot(timeSlot){
    if (with_tracer){
      const /**@type {ActivityProduction} */ production = props[JSON_PRODUCTION].get(activityDeliveryTimeSlot.production_run);
      const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(production.tracer);
      return `${tracer.shortname} - ${timeSlot.delivery_time}`;
    }

    return timeSlot.delivery_time;
  }

  const timeSlotOptions = (props[JSON_DELIVER_TIME] instanceof Map ) ?
    toOptions(props[JSON_DELIVER_TIME].values(), nameTimeSlot, 'id')
    : toOptions(props[JSON_DELIVER_TIME], nameTimeSlot, 'id');

  delete newSelectProps[JSON_DELIVER_TIME];
  delete newSelectProps[JSON_PRODUCTION];
  delete newSelectProps[JSON_TRACER];
  delete newSelectProps[PROP_ACTIVE_DATE]
  newSelectProps.options = timeSlotOptions

  return <Select
    {...newSelectProps}
  />;
};
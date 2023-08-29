/** */

import React from "react";
import { Select } from "../select";
import { JSON_DELIVER_TIME, JSON_PRODUCTION, JSON_TRACER } from "../../../lib/constants";
import { ActivityDeliveryTimeSlot, ActivityProduction, Tracer } from '../../../dataclasses/dataclasses'

export function TimeSlotSelect(props){
  const newSelectProps = {...props};

  

  const with_tracer = props[JSON_TRACER] !== undefined
                      && props[JSON_PRODUCTION] !== undefined;

  /** Method for representing the objects as select options
   *
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   * @returns {{
   *  id : String,
   *  name : String,
   * }}
   */
  function toOption(timeSlot){
    if (with_tracer){
      const /**@type {ActivityProduction} */ production = props[JSON_PRODUCTION].get(activityDeliveryTimeSlot.production_run);
      const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(production.tracer);
      return {
        id : timeSlot.id,
        name : `${tracer.shortname} - ${timeSlot.delivery_time}`,
      };
    }

    return {
      id : timeSlot.id,
      name : timeSlot.delivery_time,
    };
  }

  const timeSlotOptions = (props[JSON_DELIVER_TIME] instanceof Map ) ?
    [...props[JSON_DELIVER_TIME].values()].map(toOption)
    : props[JSON_DELIVER_TIME].map(toOption);

  delete newSelectProps[JSON_DELIVER_TIME];
  delete newSelectProps[JSON_PRODUCTION];
  delete newSelectProps[JSON_TRACER];

  return <Select
    options={timeSlotOptions}
    valueKey="id"
    nameKey="name"
    {...newSelectProps}
  />;
};
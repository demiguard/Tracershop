/**These functions should define orders between custom dataclasses
 * Also Remember Currying and Closure
*/

import { ActivityDeliveryTimeSlot, DeliveryEndpoint, TracershopState } from "../dataclasses/dataclasses";

/**
 * @enum {Number}
 */
export const PROCEDURE_SORTING = {
  PROCEDURE_CODE : 0,
  TRACER : 1,
  UNITS : 2,
  DELAY : 3,
}


/**
 * 
 * @param {TracershopState} state 
 * @param {PROCEDURE_SORTING} sortingMethod 
 * @returns 
 */
export function sort_procedures(state, sortingMethod){
  return (prod_1, prod_2) => {
    switch (sortingMethod) {
      case PROCEDURE_SORTING.PROCEDURE_CODE:{
        if (prod_1.series_description === null) return 1;
        if (prod_2.series_description === null) return -1;
        const pi_1 = state.procedure_identifier.get(prod_1.series_description);
        const pi_2= state.procedure_identifier.get(prod_2.series_description);
        return pi_1.description > pi_2.description;
      }
      case PROCEDURE_SORTING.TRACER:
        if (prod_1.tracer === null) return 1
        if (prod_2.tracer === null) return -1
        return prod_1.tracer - prod_2.tracer;
      case PROCEDURE_SORTING.UNITS:
        return prod_1.tracer_units - prod_2.tracer_units;
      case PROCEDURE_SORTING.DELAY:
        return prod_1.delay_minutes - prod_2.delay_minutes;
      default:
        throw "UNDEFINED SORTING METHOD!"
    }
  }
}


/**
 * Sorts the display order of ActivityDeliveryTimeSlots such that they are 
 * grouped in:
 * 1. By Customer
 * 2. By Endpoint
 * 3. Sorted by delivery time, earlier time is first
 * @param {Map<Number, DeliveryEndpoint>} endpoints 
 * @returns {CallableFunction}
 */
export function sortTimeSlots(endpoints){
  return (/** @type {ActivityDeliveryTimeSlot} */ timeSlot_a,
          /** @type {ActivityDeliveryTimeSlot} */ timeSlot_b) => {

    const /**@type {DeliveryEndpoint} */ endpoint_a = endpoints.get(timeSlot_a.destination);
    const /**@type {DeliveryEndpoint} */ endpoint_b = endpoints.get(timeSlot_b.destination);

    if(endpoint_a.owner != endpoint_b.owner){
      return endpoint_a.owner - endpoint_b.owner
    }
    if(timeSlot_a.destination != timeSlot_b.destination){
      return timeSlot_a.destination - timeSlot_b.destination
    }

    return  timeSlot_b.delivery_time < timeSlot_a.delivery_time ? 1 : -1;
  }
}
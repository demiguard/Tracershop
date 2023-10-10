/**These functions should define orders between custom dataclasses
 * Also Remember Currying and Closure
*/

import { ActivityDeliveryTimeSlot, DeliveryEndpoint } from "../dataclasses/dataclasses";


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
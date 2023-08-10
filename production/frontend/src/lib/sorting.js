/**These functions should do some nontrivial sorting
 * In general they should be used in Array.sort calls.
 * Note they should use currying so that you have 
 * Array.sort(func(curryData))
 * 
 */

import { ActivityDeliveryTimeSlot, DeliveryEndpoint } from "../dataclasses/dataclasses";


/**
 * Sorts the display order of ActivityDeliveryTimeSlots such that they are 
 * grouped in:
 * 1. By Customer
 * 2. By Endpoint
 * 3. Sorted by delivery time, earlier time is first
 * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
 * @param {Map<Number, DeliveryEndpoint>} endpoints 
 * @returns {Number}
 */
export function sortOrderMapping(timeSlots, endpoints){
  return ([timeSlotID_a, _orders_a], [timeSlotID_b, _orders_b]) => {
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot_a = timeSlots.get(timeSlotID_a);
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot_b = timeSlots.get(timeSlotID_b);

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
/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

import { ActivityOrder, DeliveryEndpoint, Location, Tracer } from "../dataclasses/dataclasses";

export function dayTracerFilter(day, tracerID){
  return (production) => {
    return production.production_day === day && production.tracer === tracerID
  }
}

export function timeSlotOwnerFilter(endpointID){
  return (timeSlot) => timeSlot.destination === endpointID;
}

/** Filter function for selecting delivery endpoints with a specific
 * Customer
 * 
 * @param {Number} customerID Id of the customer the endpoint should have to
 * survive the filtering
 * 
 */
export function endpointOwnerFilter(customerID){
  return (/**@type {DeliveryEndpoint} */endpoint) => endpoint.owner === customerID
}


export function tracerTypeFilter(tracerType){
  return (/** @type {Tracer} */ tracer) => tracer.tracer_type === tracerType
}


/**
 * Filters booking to a date,
 * @param {String} dateString 
 * @param {Map<Number, Location>} locations
 * @param {Number} activeEndpoint
 * @returns {CallableFunction}
 */
export function bookingFilter(dateString, locations, activeEndpoint){
  /**
  * @param {Booking} booking 
  * @returns {Boolean}
  */
  const returnFunction = (booking) =>{
    const location = locations.get(booking.location);
    booking.start_date === dateString && location.owner === activeEndpoint;
  }

  return returnFunction;
}

export function productionDayTracerFilter(day, tracerID){
  return (production) => production.production_day === day && production.tracer === tracerID
}

/**
 * Applies a filter to a collection
 * @param {Array | Map} collection 
 * @param {CallableFunction} filterFunction 
 * @returns {Array}
 */
export function applyFilter(collection, filterFunction) {
  return (collection instanceof Map) ?
    [...collection.values()].filter(filterFunction) :
    collection.filter(filterFunction);
}

export function dailyActivityOrderFilter(timeSlots, productions, delivery_date, active_tracer){
  /**
   * @param {ActivityOrder} order
   */
  return (order) => {
    const timeSlot = timeSlots.get(order.ordered_time_slot);
    if (timeSlot === undefined){
      console.log(state, order)
    }
    const production = productions.get(timeSlot.production_run);

    return order.delivery_date === delivery_date && production.tracer == active_tracer;
  }
}
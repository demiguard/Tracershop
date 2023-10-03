/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

import { Tracer } from "../dataclasses/dataclasses";

export function dayTracerFilter(day, tracerID){
  return (production) => {
    return production.production_day === day && production.tracer === tracerID
  }
}

export function timeSlotOwnerFilter(endpointID){
  return (timeSlot) => timeSlot.destination === endpointID;
}

/** Function used 
 * 
 * @param {Number} CustomerID 
 * @returns 
 */
export function endpointOwnerFilter(CustomerID){
  return (endpoint) => endpoint.owner === CustomerID
}

export function tracerTypeFilter(tracerType){
  return (/** @type {Tracer} */ tracer) => tracer.tracer_type === tracerType
}


/**
 * 
 * @param {String} dateString 
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

export function applyFilter(collection, filterFunction) {
  return (collection instanceof Map) ?
    [...collection.values()].filter(filterFunction) :
    collection.filter(filterFunction);
}


/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import { Booking, Procedure, TracerCatalog } from "../dataclasses/dataclasses"
import { TRACER_TYPE_ACTIVITY } from "./constants";


/**
 * 
 * @param {Map<Number, TracerCatalog>} TracerCatalogPages 
 * @param {Map<Number, Tracer>} Tracers 
 * @param {Number} CustomerID 
 * @returns {[Array<Tracer>, Array<Tracer>, Map<Number, Number>]}
 * @example Sample use in a React Component
 * const [activityTracers, InjectionTracers,overheadMap] = TracerCatalog(props[JSON_TRACER_MAPPING],
                                                                         props[JSON_TRACER],
                                                                         props[PROP_ACTIVE_CUSTOMER])

 */
export function TracerCatalogForCustomer(TracerCatalogPages, Tracers, CustomerID){
  const tracerCatalogActivity = new Array();
  const tracerCatalogInjections = new Array();
  const overheadMap = new Map

  for(const [pageID, _tracerCatalogPage] of TracerCatalogPages){
    const /**@type {TracerCatalog} */ page = _tracerCatalogPage;
    if(page.customer != CustomerID){
      continue;
    }
    const /**@type {Tracer} */ tracer = Tracers.get(page.tracer);
    if(tracer.tracer_type === TRACER_TYPE_ACTIVITY){
      overheadMap.set(page.tracer, page.overhead_multiplier);
      tracerCatalogActivity.push(tracer);
    } else {
      tracerCatalogInjections.push(tracer);
    }
  }

  return [tracerCatalogActivity, tracerCatalogInjections, overheadMap]
}

/**
 * @param {Array<Booking>} bookings 
 * @param {Map<Number, Procedure>} procedures 
 * @returns {Map<Number,Array<Booking>>}
 * 
 * @example Sample use in React Component
 const bookingTracerMap = bookingTracerMapping([...props[JSON_BOOKING].values()],
                                               props[JSON_PROCEDURES])
 */
export function bookingTracerMapping(bookings,procedures){
  // Call structure is with a booking array and not a Map,
  // because you normally wanna filter some bookings out before calling this
  const bookingTracerMap = new Map() // this is gonna be an array map

  for(const booking of bookings){
    const procedure = procedures.get(booking.procedure)
    let tracerKey = null;
    if (procedure.tracer){
      tracerKey = procedure.tracer // Null / undefined is a valid value here!
    }

    if (bookingTracerMap.has(tracerKey)){
      bookingTracerMap.get(tracerKey).push(booking)
    } else {
      bookingTracerMap.set(tracerKey, [booking])
    }
  }

  return bookingTracerMap
}
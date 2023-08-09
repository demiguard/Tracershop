/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import { Booking, Procedure, TracerCatalog } from "../dataclasses/dataclasses"
import { TRACER_TYPE_ACTIVITY } from "./constants";


/**
 * Creates a list of activity tracers that the customer can order 
 * The main idea is that these should be run once of each customer
 * @param {Map<Number, TracerCatalog>} TracerCatalogPages 
 * @param {Map<Number, Tracer>} Tracers 
 * @param {Number} CustomerID 
 * @returns {[Array<Tracer>, Array<Tracer>, Map<Number, Number>]}
 * @example Sample use in a React Component
 * const [activityTracers, InjectionTracers,overheadMap] = TracerCatalog(props[JSON_TRACER_MAPPING],
                                                                         props[JSON_TRACER],
                                                                         props[PROP_ACTIVE_CUSTOMER])

 */
export function createTracerCatalogForCustomer(TracerCatalogPages, Tracers, CustomerID){
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

/** Data structure that sorts out booking into a mapping, where the key is the
 * tracer ID that is used in each of bookings
 * @param {Array<Booking>} bookings - The bookings to be mapped
 * @param {Map<Number, Procedure>} procedures - The procedures that bookings are using
 * @returns {Map<Number,Array<Booking>>}
 * 
 * @example Sample use in React Component
 const bookingTracerMap = bookingTracerMapping([...props[JSON_BOOKING].values()],
                                               props[JSON_PROCEDURES])
 */
export function createBookingTracerMapping(bookings,procedures){
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

export function createTimeSlotMapping(
  endpoints,
  timeSlots,
  relevantProductions,
){
  const /**@type {Map<Number, Map<Number, Array<ActivityDeliveryTimeSlot>>>} */ timeSlotMapping = new Map()

  for(const endpoint of endpoints.values()){
    if(timeSlotMapping.has(endpoint.owner)){
      const endpointMap = timeSlotMapping.get(endpoint.owner)
      endpointMap.set(endpoint.id, [])
    } else {
      const endpointMap = new Map()
      endpointMap.set(endpoint.id, [])
      timeSlotMapping.set(endpoint.id, endpointMap)
    }
  }

  for(const timeSlot of timeSlots){
    // You can't turn this into a map because of the sorting ruins parallelism
    if(!relevantProductions.includes(timeSlot.production_run)){
      continue;
    }

    // Destination is an endpoint ID
    const /**@type {DeliveryEndpoint} */ endpoint = endpoints.get(timeSlot.destination);
    const destinationMapping = timeSlotMapping.get(endpoint.owner)

    if(destinationMapping === undefined){
      // Log error
      console.log("Error")
      continue;
    }

    destinationMapping.get(endpoint.id).push(timeSlot);
    destinationMapping.get(endpoint.id).sort((a,b) => {
      return (a.delivery_time < b.delivery_time) ? -1 : 1;
    });
  }

  return timeSlotMapping
}

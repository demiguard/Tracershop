/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, Tracer, DeliveryEndpoint, Location, Procedure, ProcedureIdentifier, TracerCatalogPage } from "../dataclasses/dataclasses"
import { ArrayMap } from "./array_map";
import { TRACER_TYPE } from "./constants";
import { applyFilter, timeSlotOwnerFilter } from "./filters";

/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  /**
   * 
   * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages 
   * @param {Map<Number, Tracer>} tracers 
   * @param {Number} customerID 
   */
  constructor(tracerCatalogPages, tracers, customerID){
    this._customerID = customerID;
    this._tracerCatalogActivity = [];
    this._tracerCatalogInjections = [];
    this._overheadMap = new Map();
    for(const tracerCatalogPage of tracerCatalogPages.values()){
      if(tracerCatalogPage.customer !== customerID){
        continue;
      }
      const /**@type {Tracer} */ tracer = tracers.get(tracerCatalogPage.tracer);
      if(tracer === undefined){
        continue;
      }

      if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
        this._overheadMap.set(tracerCatalogPage.tracer, tracerCatalogPage.overhead_multiplier);
        this._tracerCatalogActivity.push(tracer);
      } else if (tracer.tracer_type === TRACER_TYPE.DOSE) {
        this._tracerCatalogInjections.push(tracer);
      }
    }
  }

  getActivityCatalog(){
    return this._tracerCatalogActivity;
  }

  getInjectionCatalog(){
    return this._tracerCatalogInjections;
  }

  getOverheadForTracer(tracerID){
    return this._overheadMap.get(tracerID)
  }
}

/**
 * Creates a mapping over the related activity delivery time slots.
 * The data structure does two things:
 * 1. Filter out time slots of the wrong day and tracer
 * 2. Group TimeSlots together so a time slot can figure out if and what time
 *    slot it should move to.
 * @param {Map<Number, DeliveryEndpoint>} endpoints 
 * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
 * @param {Array<ActivityProduction>} relevantProductions 
 * @returns {Map<Number, Map<Number, ActivityDeliveryTimeSlot>}
 */
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

  for(const timeSlot of timeSlots.values()){
    if(!relevantProductions.includes(timeSlot.production_run)){
      continue;
    }

    // Destination is an endpoint ID
    const endpoint = endpoints.get(timeSlot.destination);
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


/**
 * Creates a mapping over what time slots should be render and with what orders
 * If a time slot is missing from the map, that means it should not be rendered.
 * @param {Array<ActivityOrder>} orders 
 * @returns {Map<Number, Array<ActivityOrder>}
 */
export function createOrderMapping(orders){
  const OrderMapping = new Map()
  for(const order of orders){
    if (OrderMapping.has(order.ordered_time_slot)){
      OrderMapping.get(order.ordered_time_slot).push(order)
    } else {
      OrderMapping.set(order.ordered_time_slot, [order])
    }

    if(order.moved_to_time_slot != null){
      if (OrderMapping.has(order.moved_to_time_slot)){
        OrderMapping.get(order.moved_to_time_slot).push(order)
      } else {
        OrderMapping.set(order.moved_to_time_slot, [order])
      }
    }
  }

  return OrderMapping
}


/**
 * gets a procedure, if it doesn't exists create a dummy object
 * @param {Map<Number, Procedure>} procedures 
 * @param {ProcedureIdentifier} identifier 
 * @param {DeliveryEndpoint} endpoint 
 */
export function getProcedure(procedures, identifier, endpoint){
  // So here is where the idea of how procedures are represented in tracershop
  // A procedure is a combination of a string and a place. That way two places
  // can have two different configurations of the same study.
  // The downside is that it creates a fragmented view of a procedure.
  for(const mapProcedure of procedures.values()){
    if(mapProcedure.owner === endpoint.id
      && mapProcedure.series_description === identifier.id) {
        return mapProcedure;
      }
    }
  return new Procedure(undefined, identifier.id, "", "", "", endpoint.id);
}

/**
 * Filters out ActivityDeliveryTimeSlots not owned by EndpointID
 * @param {Array<ActivityDeliveryTimeSlot>| Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
 * @param {Number} endpointID - Number corresponding to the ID of the Endpoint
 * @returns {Array<ActivityDeliveryTimeSlot>}
 */
export function getRelatedTimeSlots(timeSlots, endpointID) {
  return applyFilter(timeSlots, timeSlotOwnerFilter(endpointID))
}


export class ProcedureLocationIndex {
  /** @type {Map<Number, Map<Number, Procedure>}*/ _dataStructure

/**
 * @param {Map<Number,Procedure>} procedures 
 * @param {Map<Number, Location>} Locations 
 */
  constructor(procedures, Locations){
    this._dataStructure = new Map();
    const locationHelper = new ArrayMap();

    for(const location of Locations.values()){
      locationHelper.set(location.endpoint, location.id);
    }

    for(const procedure of procedures.values()){
      const map = new Map()
      this._dataStructure.set(procedure.series_description, map);
      const locationIDs = locationHelper.get(procedure.owner);
      for(const locationID of locationIDs){
        map.set(locationID, procedure);
      }
    }
  }

  /**
   * Retrieves the associated procedure to a booking.
   * @param {Booking} booking - Booking
   * @return {Procedure | undefined}
   */
  getProcedure(booking){
    if(!this._dataStructure.has(booking.procedure)){
      return undefined
    }

    const subMap = this._dataStructure.get(booking.procedure);
    return subMap.get(booking.location);
  }
}

export class TracerBookingMapping {
  /** @type {ArrayMap<Number | undefined, Booking>} */ _map

  /**
   * 
   * @param {Iterable<Booking>} bookings 
   * @param {ProcedureLocationIndex} procedureLocationIndex
   */
  constructor(bookings, procedureLocationIndex){
    this._map = new ArrayMap();

    for(const booking of bookings){
      const procedure = procedureLocationIndex.getProcedure(booking);
      if (procedure === undefined){
        continue;
      }

      this._map.set(procedure.tracer, booking);
    }
  }

  *[Symbol.iterator](){
    for(const [tracer, bookings] of this._map){
      yield [tracer, bookings]
    }
  }
}

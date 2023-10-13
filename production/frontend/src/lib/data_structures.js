/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, Tracer, DeliveryEndpoint, Location, Procedure, ProcedureIdentifier, TracerCatalogPage, Customer } from "../dataclasses/dataclasses"
import { ArrayMap } from "./array_map";
import { TRACER_TYPE } from "./constants";
import { applyFilter, timeSlotOwnerFilter } from "./filters";
import { sortTimeSlots } from "./sorting";
import { numberfy } from "./utils";


export class CustomerCatalog {
  /**@type {Array<Tracer>} */ tracerCatalogActivity
  /**@type {Array<Tracer>} */ tracerCatalogInjections
  /**@type {Map<Number, Number>} */ overheadMap

  constructor() {
    this.tracerCatalogActivity = [];
    this.tracerCatalogInjections = [];
    this.overheadMap = new Map();
  }
}


/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  /**@type {Map<Number, CustomerCatalog } */ _customerCatalogs

  /**
   * Data structure containing information about which tracers a customer have access to
   * Each instance is unique to a customer.
   * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages
   * The Collection of mappings of customer to tracer, where an entry implies the customer is allowed to order
   * @param {Map<Number, Tracer>} tracers The Collection of all tracers
   */
  constructor(tracerCatalogPages, tracers){
    this._customerCatalogs = new Map()

    for(const tracerCatalogPage of tracerCatalogPages.values()){
      if(!this._customerCatalogs.has(tracerCatalogPage.customer)){
        this._customerCatalogs.set(tracerCatalogPage.customer, new CustomerCatalog())
      }

      const customer_catalog = this._customerCatalogs.get(tracerCatalogPage.customer)

      const /**@type {Tracer} */ tracer = tracers.get(tracerCatalogPage.tracer);
      if(tracer === undefined){
        throw "Database intregrety violated!"
      }

      if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
        customer_catalog.overheadMap.set(tracerCatalogPage.tracer, tracerCatalogPage.overhead_multiplier);
        customer_catalog.tracerCatalogActivity.push(tracer);
      } else if (tracer.tracer_type === TRACER_TYPE.DOSE) {
        customer_catalog.tracerCatalogInjections.push(tracer);
      }
    }
  }

  /**
   * Gets the entire catalog for a customer
   * @param {Number} customerID - the ID of the customer in question
   * @returns {CustomerCatalog}
   */
  getCatalog(customerID){
    const index = numberfy(customerID)

    const customer_catalog = this._customerCatalogs.get(index);
    if (customer_catalog !== undefined){
      return customer_catalog
    }
    throw "Undefined customer referenced";
  }

  getActivityCatalog(customerID){
    const index = numberfy(customerID)
    const customer_catalog = this._customerCatalogs.get(index);
    if (customer_catalog !== undefined){
      return customer_catalog.tracerCatalogActivity;
    }
    throw "Undefined customer referenced";
  }

  /**
   * Gets the injections tracers a customer can order
   * @param {Number} customerID 
   * @returns {Array<Tracer>}
   */
  getInjectionCatalog(customerID){
    const index = numberfy(customerID)
    const customer_catalog = this._customerCatalogs.get(index);
    if (customer_catalog !== undefined){
      return customer_catalog.tracerCatalogInjections;
    }
    throw "Undefined customer referenced";
  }

  getOverheadForTracer(customerID, tracerID){
    const customer_index = numberfy(customerID)
    const tracer_index = numberfy(tracerID)
    const customer_catalog = this._customerCatalogs.get(customer_index);
    if (customer_catalog !== undefined){
      return customer_catalog.overheadMap.get(tracer_index);
    }
    throw "Undefined customer referenced"
  }
}


export class TimeSlotMapping {
  /**@type {Map<Number, ArrayMap<Number, ActivityDeliveryTimeSlot>} */ _timeSlotMapping

  /**
  * Creates a mapping over the related activity delivery time slots.
  * The data structure does two things:
  * 1. Filter out time slots of the wrong day and tracer
  * 2. Group TimeSlots together so a time slot can figure out if and what time
  *    slot it should move to.
  * @param {Map<Number, DeliveryEndpoint>} endpoints
  * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
  * @param {Array<Number>} relevantProductions 
   */
  constructor(endpoints, timeSlots, relevantProductions) {
    /* The underlying datastructure 
      Customer_1 --> Endpoint_1 -> [time_slot_1, time_slot_2] // Sorted by time
    */
    this._timeSlotMapping = new Map();
    this._endpoints = endpoints


    for(const endpoint of endpoints.values()){
      if(!this._timeSlotMapping.has(endpoint.owner)){
        this._timeSlotMapping.set(endpoint.id, new ArrayMap())
      }
    }

    for(const timeSlot of timeSlots.values()){
      if(!relevantProductions.includes(timeSlot.production_run)){
        continue;
      }

      // Destination is an endpoint ID
      const endpoint = endpoints.get(timeSlot.destination);
      const destinationMapping = this._timeSlotMapping.get(endpoint.owner)

      if(destinationMapping === undefined){
        // Log error
        console.log("Error, A timeslot have destination mapping")
        continue;
      }

      destinationMapping.set(endpoint.id, timeSlot);
      destinationMapping.sortEntries(endpoint.id, (a,b) => {
        return (a.delivery_time < b.delivery_time) ? -1 : 1;
      });
    }
  }

  /**
   * 
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   */
  getFirstTimeSlot(timeSlot){
    const endpoint = this._endpoints.get(timeSlot.destination);
    const destinationMap = this._timeSlotMapping.get(endpoint.owner)
    return destinationMap.get(endpoint.id)[0];
  }
}



export class ProductionTimeSlotOwnerShip {
  /**@type {ArrayMap<Number, ActivityDeliveryTimeSlot>} underlying data structure */ _productionMapping

  /**
   * 
   * @param {Array<Number>} relevantProductions 
   * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
   */
  constructor(relevantProductions, timeSlots){
    this._productionMapping = new ArrayMap()
    for(const activityDeliveryTimeSlot of timeSlots.values()){
      // You can't turn this into a map because of the sorting ruins parallelism
      if(!relevantProductions.includes(activityDeliveryTimeSlot.production_run)){
        continue;
      }
      this._productionMapping.set(activityDeliveryTimeSlot.production_run, activityDeliveryTimeSlot);
    }
  }

  getTimeSlots(productionID){
    return this._productionMapping.get(productionID);
  }
}


/**
 * Creates a mapping over time slots with which orders should be rendered under the time slot
 * If a time slot is missing from the map, that means it should not be rendered.
 * @param {Array<ActivityOrder>} orders 
 * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots
 * @param {Map<Number, DeliveryEndpoint>}
 * @returns {Map<Number, Array<ActivityOrder>}
 */
export class OrderMapping{
  /**@type {ArrayMap<Number, ActivityOrder>} */ _orderMapping
  /**@type {Map<Number, ActivityDeliveryTimeSlot>} */ _timeSlots
  /**@type {Map<Number, DeliveryEndpoint>} */ _endpoints

  constructor(orders, timeSlots, endpoints){
    this._orderMapping = new ArrayMap();
    this._timeSlots = timeSlots;
    this._endpoints = endpoints;

    for(const order of orders){
      this._orderMapping.set(order.ordered_time_slot, order);

      if(order.moved_to_time_slot != null){
        this._orderMapping.set(order.moved_to_time_slot,order);
      }
    }
  }

  /**
   * 
   * @param {Number} timeSlotID 
   * @returns {Array<ActivityOrder>}
   */
  getOrders(timeSlotID){
    return this._orderMapping.get(timeSlotID);
  }

  *[Symbol.iterator](){
    const timeSlots = [];
    for(const timeSlotID of this._orderMapping.keys()){
      timeSlots.push(this._timeSlots.get(timeSlotID));
    }

    timeSlots.sort(sortTimeSlots(this._endpoints));
    for(const timeSlot of timeSlots){
      yield timeSlot
    }
  }
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

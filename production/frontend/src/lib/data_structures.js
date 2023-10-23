/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, Tracer, DeliveryEndpoint, Location, Procedure, ProcedureIdentifier, TracerCatalogPage, Customer } from "../dataclasses/dataclasses"
import { ArrayMap } from "./array_map";
import { getDay, getWeekNumber } from "./chronomancy";
import { TRACER_TYPE, WEEKLY_REPEAT_CHOICES } from "./constants";
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
  * @param {Map<Number, DeliveryEndpoint>} endpoints - This should be all
  * @param {Map<Number, ActivityDeliveryTimeSlot>} timeSlots 
  * @param {Array<Number>} relevantProductions 
   */
  constructor(endpoints, timeSlots, relevantProductions) {
    /* The underlying datastructure 
      Customer_1 --> Endpoint_1 -> [time_slot_1, time_slot_2] // Sorted by time
                 --> Endpoint_2 -> [time_slot_3, time_slot_4]
      Customer_2 ...
    */
    this._timeSlotMapping = new Map();
    this._endpoints = endpoints


    for(const endpoint of endpoints.values()){
      if(!this._timeSlotMapping.has(endpoint.owner)){
        this._timeSlotMapping.set(endpoint.owner, new ArrayMap())
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
        console.log(`Error, A timeslot ${timeSlot.id} have no delivery endpoint mapping`)
        console.log(endpoints);
        continue;
      }

      destinationMapping.set(endpoint.id, timeSlot);
      destinationMapping.sortEntries(endpoint.id, (a,b) => {
        return (a.delivery_time < b.delivery_time) ? -1 : 1;
      });
    }
  }

    *[Symbol.iterator](){
      for(const timeSlotMap of this._timeSlotMapping){
        yield timeSlotMap;
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

export class EndpointsProcedures {
  /** @type {Map<Number, Map<String, Procedure>>} */ _procedures

  /**
   * 
   * @param {Map<Number, Procedure>} procedures 
   */
  constructor(procedures){
    this._procedures = new Map();

    for(const procedure of procedures.values()) {
      let subMap
      if(this._procedures.has(procedure.owner)){
        subMap = this._procedures.get(procedure.owner);
      } else {
        subMap = new Map()
        this._procedures.set(procedure.owner, subMap);
      }
      subMap.set(procedure.series_description, procedure);
    }
  }

  getProcedures(endpointID){
    const tempMap = this._procedures.get(endpointID);
    if(tempMap === undefined){
      return new Map();
    } else {
      return tempMap;
    }
  }
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
  constructor(procedures, Locations, active_endpoint){
    this._dataStructure = new Map();
    const locationHelper = new ArrayMap();

    for(const location of Locations.values()){
      locationHelper.set(location.endpoint, location.id);
    }

    for(const procedure of procedures.values()){
      if(procedure.owner !== active_endpoint){
        // This is needed otherwise others procedure will overwrite.
        continue;
      }
      const map = new Map()
      this._dataStructure.set(procedure.series_description, map);
      const locationIDs = locationHelper.get(procedure.owner);
      if (locationIDs !== undefined){
        for(const locationID of locationIDs){
          map.set(locationID, procedure);
        }
      } else {
        console.log("Location IDs undefined!")
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

export class ProcedureIndex {
  /** @type {Map<Number, >}*/ _dataStructure
  
  constructor(){
    this._dataStructure = new Map();
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
        this._map.set(null, booking)
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


/**
 * An interface for a bit chain. I.E an encoded int with an evaluate function
 */
export class BitChain {
  constructor(){
    this._chain = 0;
  }

  /**
   * Function that evau
   * @returns {Boolean} 
   */
  eval(){
    throw "Virtual Function"
  }
}

export class TimeSlotBitChain extends BitChain {
  /**@type {Number} */ _chain

  /**
   * A data structure for evaluating if you can order at a date determined by
   * time slots.
   * @param {Array<ActivityDeliveryTimeSlot>} timeSlots - Time Slots determining
   * the bit chains
   * @param {Map<Number, ActivityProduction>} production - All productions as
   * time slot refer to a production.
   */
  constructor(timeSlots, productions){
    super();
    this._chain = 0;

    for(const timeSlot of timeSlots){
      const production = productions.get(timeSlot.production_run);

      if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
        this._chain = this._chain | (1 << production.production_day);
      }

      if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
        this._chain = this._chain | (1 << production.production_day + 7);
      }
    }
  }

  eval(date){
    const oddWeekNumber = (getWeekNumber(date) % 2) == 1
    const day = getDay(date);

    return this._chain & (1 << (day + Number(oddWeekNumber) * 7))
  }
}


export class ProductionBitChain extends BitChain {
  /**@type {Number} */ _chain

  /**
   *
   * @param {Map<Number, ActivityProduction>} productions 
   */
  constructor(productions){
    super()
    this._chain = 0;

    for(const production of productions.values()){
      this._chain = this._chain | (1 << production.production_day);
    }
  }

  eval(date){
    const day = getDay(date);

    return this._chain & (1 << day)
  }
}

/**
 * 
 * @param {Map<Number,ActivityOrder | InjectionOrder>} orders
 */
export class OrderDateMapping {
  /**@type {Map<String, Number>} */_orderMap

  constructor(orders) {
    this._orderMap = new Map();
    for(const order of orders){
      if (this._orderMap.has(order.delivery_date)){
        this._orderMap.set(order.delivery_date, Math.min(order.status, this._orderMap.get(order.delivery_date)))
      } else {
        this._orderMap.set(order.delivery_date, order.status)
      }
    }
  }

  /**
   *
   * @param {String} date_string 
   * @returns 
   */
  get_status_for_date(date_string){
    return this._orderMap.get(date_string);
  }

  /**
   * Check if the order mapping has 
   * @param {String} date_string 
   * @returns 
   */
  has_status_for_date(date_string){
    return this._orderMap.has(date_string)
  }
}


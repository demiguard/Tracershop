/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import React, {useRef, useState} from 'react'

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, Tracer, DeliveryEndpoint, Location, Procedure, ProcedureIdentifier, TracerCatalogPage, Customer, ReleaseRight, Isotope, TracershopState, User } from "../dataclasses/dataclasses"
import { ArrayMap } from "./array_map";
import { TimeStamp, compareTimeStamp, getDay, getWeekNumber } from "./chronomancy";
import { ORDER_STATUS, TRACER_TYPE, USER_GROUPS, WEEKLY_REPEAT_CHOICES, OrderStatus, valueof } from "./constants";
import { applyFilter, bookingFilter, locationEndpointFilter, locationFilter, timeSlotOwnerFilter } from "./filters";
import { dateToDateString } from "./formatting";
import { CalculateProduction } from "./physics";
import { sortTimeSlots } from "./sorting";
import { HoverBox } from "~/components/injectable/hover_box"
import { TIME_TABLE_CELL_HEIGHT_PIXELS } from "~/components/injectable/time_table"
import { getId, numberfy, toMapping } from "./utils";
import { useTracershopState } from "~/components/tracer_shop_context"
import { useOverflow } from "~/effects/overflow"

//#region ActivityOrderCollection
/**
 * Wraps a group of orders, for the purpose of providing a single view of the
 * group.
 *
 * All orders must share the following properties to form a valid ActivityOrderCollection:
 * * ordered_date
 * * All orders must be scheduled to be delivered in the same time slot
 *
 * This property grants the following properties:
 * * Same Tracer and isotope because Time slots can only have a one production
 * * Same DeliveryEndpoint / Customer, with the same reasons
 *
 * One could think about an instance as the piece of paper a waiter write down a
 * group of people orders, which then gets handed to the kitchen.
 */
export class ActivityOrderCollection {
  /**
   * @desc Underlying collection that this class wraps, orders in this list
   * will be delivered to the same endpoint at same day.
   * @type {Array<ActivityOrder>}
   */ orders
  /**
   * @desc Time slot that {@link orders} will be delivered to.
   * @type {ActivityDeliveryTimeSlot}
   */ delivering_time_slot

  /**
   * @desc the minimum status among {@link orders} with the ordering:
   * AVAILABLE < ORDERED < ACCEPTED < RELEASED < CANCELLED < UNAVAILABLE
   * @type {ORDER_STATUS}
   */ minimum_status
  /**
   * @desc Shared date between {@link orders}
   * @type {String}
   */ ordered_date
  /**
   * @desc DeliveryEndpoint for {@link delivering_time_slot}
   * @type {DeliveryEndpoint}
   */ endpoint
  /**
   * @desc Owner of {@link endpoint} which take deliveries from {@link delivering_time_slot}
   * @type {Customer}
   */ owner
  /**
   * @desc Tracer for {@link delivering_time_slot}
   * @type {Tracer}
   */ tracer
  /**
   * @desc Isotope of the {@link tracer}
   * @type {Isotope}
   */ isotope
  /**
   * @desc The production for {@link delivering_time_slot}
   * @type {ActivityProduction}
   */ production
  /**
   * @desc If all orders of {@link orders}, then this string holds the time
   * the collection was freed
   * @type {String | null}
   */ freed_time
  /**
   * @desc If {@link orders} contains any orders, that do not delivery to the
   * time slot that they have been ordered to, then this is true otherwise false
   * @type {Boolean}
   */ moved
  /**
   * @desc Combined ordered activity of {@link orders} with out overhead
   * @type {Number}
   */ ordered_activity
  /**
   * @desc Combined activity ordered of {@link orders} with accounting for
   * overhead
   * @type {Number}
   */ deliver_activity
  /**
   * @desc Activity released to fulfil {@link orders}
   * @type {Number}
   */ delivered_activity

  /**
   * @desc ID of all orders in the collection of {@link orders}
   * @type {Array<Number>}
   */ orderIDs

  /**
   * @desc If the orderCollection was freed, then this is the user that freed
   * them
   * @type {User | null}
   */ freed_by

/**
  * Wraps a group of orders, for the purpose of providing a single view of the
  * group.
  *
  * All orders must share the following properties to form a valid ActivityOrderCollection:
  * * ordered_date
  * * tracer
  * * endpoint
  *
  * One could think about an instance as the piece of paper a waiter write down a
  * group of people orders, which then gets handed to the kitchen.
  * @param {Array<ActivityOrder>} activity_orders
  * @param {TracershopState} state
  */
  constructor(activity_orders, state, overhead = 1) {
    this.minimum_status = ORDER_STATUS.UNAVAILABLE;
    this.ordered_date = null;
    this.endpoint = null;
    this.owner = null;
    this.tracer = null;
    this.isotope = null;
    this.delivering_time_slot = null;
    this.freed_time = null;
    this.freed_by = null;
    this.production = null;
    this.moved = true;
    this.ordered_activity = 0;
    this.deliver_activity = 0;
    this.delivered_activity = 0;
    this.orders = activity_orders;
    this.orderIDs = activity_orders.map(getId);
    for(const order of activity_orders) {
      // Guard Statements
      const deliveringTimeSlotId = order.moved_to_time_slot ?
        order.moved_to_time_slot : order.ordered_time_slot;
      if(this.delivering_time_slot == null || this.ordered_date == null) {
        this.ordered_date = order.delivery_date;
        this.delivering_time_slot = state.deliver_times.get(deliveringTimeSlotId);
        this.production = state.production.get(this.delivering_time_slot.production_run);
        this.tracer = state.tracer.get(this.production.tracer);
        this.isotope = state.isotopes.get(this.tracer.isotope);
        this.endpoint = state.delivery_endpoint.get(this.delivering_time_slot.destination);
        this.owner = state.customer.get(this.endpoint.owner);
      } else if (this.ordered_date != order.delivery_date
              || this.delivering_time_slot.id != deliveringTimeSlotId) {
        console.log(this, order, deliveringTimeSlotId);
        throw "Incorrect filtered orders!";
      }
      // Update internal values
      const originalTimeSlot =  state.deliver_times.get(order.ordered_time_slot);
      this.minimum_status = Math.min(this.minimum_status, order.status);
      this.moved &= order.moved_to_time_slot !== null;
      if(order.ordered_time_slot === deliveringTimeSlotId){
        this.ordered_activity += order.ordered_activity
        this.deliver_activity += order.ordered_activity * overhead;
      } else {
        const timeDelta = compareTimeStamp(originalTimeSlot.delivery_time,
                                           this.delivering_time_slot.delivery_time);
        this.deliver_activity += CalculateProduction(this.isotope.halflife_seconds,
                                                     timeDelta.hour * 60 + timeDelta.minute,
                                                     order.ordered_activity) * overhead;
      }
      if(order.freed_datetime !== null && this.freed_time === null){
        this.freed_time = order.freed_datetime;
      }
      if(order.freed_by !== null && this.freed_by === null){
        this.freed_by = state.user.get(order.freed_by);
      }
    } // End of Order for loop;
    if(this.minimum_status === ORDER_STATUS.RELEASED){
      for(const vial of state.vial.values()){
        if (this.orderIDs.includes(vial.assigned_to)){
          this.delivered_activity += vial.activity;
        }
      }
    }
  }

  get_minimum_status () {
    return this.minimum_status;
  }
}

//#region EndpointCatalog
export class EndpointCatalog {
  /**@type {Array<Tracer>} */ tracerCatalogActivity
  /**@type {Array<Tracer>} */ tracerCatalogInjections
  /**@type {Map<Number, Number>} */ overheadMap

  constructor() {
    this.tracerCatalogActivity = [];
    this.tracerCatalogInjections = [];
    this.overheadMap = new Map();
  }
}


//#region TracerCatalog
/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  /**@type {Map<Number, EndpointCatalog } */ _endpointCatalogs

  /**
   * Data structure containing information about which tracers a customer have access to
   * Each instance is unique to a customer.
   * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages
   * The Collection of mappings of customer to tracer, where an entry implies the customer is allowed to order
   * @param {Map<Number, Tracer>} tracers The Collection of all tracers
   */
  constructor(tracerCatalogPages, tracers){
    this._endpointCatalogs = new Map()

    for(const tracerCatalogPage of tracerCatalogPages.values()){
      if(!this._endpointCatalogs.has(tracerCatalogPage.endpoint)){
        this._endpointCatalogs.set(tracerCatalogPage.endpoint, new EndpointCatalog())
      }

      const endpoint_catalog = this._endpointCatalogs.get(tracerCatalogPage.endpoint)

      const /**@type {Tracer} */ tracer = tracers.get(tracerCatalogPage.tracer);
      if(tracer === undefined){
        throw "Database intregrety violated!"
      }

      if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
        endpoint_catalog.overheadMap.set(tracerCatalogPage.tracer, tracerCatalogPage.overhead_multiplier);
        endpoint_catalog.tracerCatalogActivity.push(tracer);
      } else if (tracer.tracer_type === TRACER_TYPE.DOSE) {
        endpoint_catalog.tracerCatalogInjections.push(tracer);
      }
    }
  }

  /**
   * Gets the entire catalog for a customer
   * @param {Number} endpointID - the ID of the customer in question
   * @returns {EndpointCatalog}
   */
  getCatalog(endpointID){
    const index = numberfy(endpointID);

    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined){
      return endpoint_catalog;
    }
    console.log("Undefined endpoint referenced");
    return new EndpointCatalog();
  }

  getActivityCatalog(customerID){
    const index = numberfy(customerID)
    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined){
      return endpoint_catalog.tracerCatalogActivity;
    }
    return [];
  }

  /**
   * Gets the injections tracers a customer can order
   * @param {Number} endpointID
   * @returns {Array<Tracer>}
   */
  getInjectionCatalog(endpointID){
    const index = numberfy(endpointID)
    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined){
      return endpoint_catalog.tracerCatalogInjections;
    }
    return [];
  }

  getOverheadForTracer(endpointID, tracerID){
    const endpoint_index = numberfy(endpointID)
    const tracer_index = numberfy(tracerID)
    const endpoint_catalog = this._endpointCatalogs.get(endpoint_index);
    if (endpoint_catalog !== undefined){
      return endpoint_catalog.overheadMap.get(tracer_index);
    }
    // There should be a handle here!
    console.log(`Undefined customer - ${endpointID}, tracer ${tracerID} referenced`);
    return 1;
  }
}

//#region TimeSlotMapping
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
   * Gets the first available time slot in a grouping of time slots from the
   * same day and tracer
   * @param {ActivityDeliveryTimeSlot} timeSlot
   * @returns {ActivityDeliveryTimeSlot}
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
      return  tempMap;
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

/**
 * @template T
 */
export class ProcedureIndex {
  /** @type {Map<Number,T >}*/ _dataStructure

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
   * A data structure for figuring out if tracer is being produced at a day.
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

/**
 * This is a mapping over the various release rights a Production user have.
 * To determine if a user have rights to free a tracer:
 * @example
 * // Return true or false
 * const releaseRightHolder = new ReleaseRightHolder(user, releaseRights);
 * releaseRightHolder.permissionForTracer(tracer);
 */
export class ReleaseRightHolder {
  /** @type {Map} */_rightsMap
  /** @type {Boolean} */ _allowAll

  /**
   * This is a mapping over the various release rights a Production user have.
  * To determine if a user have rights to free a tracer:
  * @example
  * // Return true or false
  * const releaseRightHolder = new ReleaseRightHolder(user, releaseRights);
  * releaseRightHolder.permissionForTracer(tracer);
   * @param {User} user
   * @param {Map<Number, ReleaseRight>} releaseRights
   */
  constructor(user, releaseRights) {
    this._rightsMap = new Map();
    this._allowAll = user.user_group === USER_GROUPS.ADMIN;
    // While this class are personal, but that should be fine since it's a very rare
    // that users switch around.

    for(const releaseRight of releaseRights.values()){
      if(releaseRight.releaser !== user.id) {
        continue;
      }

      this._rightsMap.set(releaseRight.product, releaseRight.expiry_date);
    }
  }

  permissionForTracer(tracer, now){
    if(now === undefined){
      now = new Date();
    }

    if(tracer instanceof Tracer){
      tracer = tracer.id;
    }

    if(this._allowAll) {
      return true;
    }

    const expiry_date = this._rightsMap.get(tracer);

    if(expiry_date === undefined){
      return false;
    }

    if(expiry_date === null){
      return true;
    }

    return now < new Date(expiry_date);
  }
}

/**
 * @template T,U
 */
export class ITimeTableDataContainer {
  /** @type {Map<Number, ArrayMap<Number, U>>}*/ entryMapping
  /** @type {Map<Number, T>}*/ columns
  /** @type {(T) => Element} */ columnNameFunction
  /** @type {([U]) => Element} */ cellFunction
  /** @type {Number} The starting hour of the Time Table */ min_hour
  /** @type {Number} The stopping hour of the Time Table */ max_hour

  /**
   *
   * @param {(T) => Element} columnNameFunction
   * @param {([U]) => Element} cellFunction
   */
  constructor(columnNameFunction, cellFunction){
    this.entryMapping = new Map();
    this.columns = new Map();
    this.min_hour = 8;
    this.max_hour = 18;
    this.columnNameFunction = columnNameFunction;
    this.cellFunction = cellFunction;
  }


}

/**
 *
 * @param {Array<Booking>} bookings
 * @returns
*/
function BookingCell({bookings}){
  const state = useTracershopState();
  const [hasOverflowed, setHasOverflowed] = useState(false);
  const ref = useRef();
  // Note we do not use the actually overflow to determine rendering.
  // This is to prevent flickering back and forth between an over- and
  // underflowing of the component
  useOverflow(ref, (overflow) => {
    if(overflow){
      setHasOverflowed(true);
    }
  });

  const StudyDescription = bookings.map((booking) => {
    const procedureIdentifier = state.procedure_identifier.get(booking.procedure);
    return <div key={booking.id}>{procedureIdentifier.description}</div>
  });
  const hoverContent = bookings.map((booking) => {
    const procedureIdentifier = state.procedure_identifier.get(booking.procedure);

    return <div key={booking.id} style={{
      border : "2px",
      borderStyle : "solid",
      borderColor : "black",
      padding : "5px",
      margin : "5px",
    }}>
      <div>{procedureIdentifier.description}</div>
      <div>{booking.start_time}</div>
      <div>{booking.accession_number}</div>
    </div>;}
  );

  const lineHeight = hasOverflowed ? TIME_TABLE_CELL_HEIGHT_PIXELS : "normal";
  const baseContent = hasOverflowed ? <p>{bookings.length} undersøgelser</p> : <div>{StudyDescription}</div>
  const base = <div ref={ref} style={{ height : TIME_TABLE_CELL_HEIGHT_PIXELS, lineHeight : lineHeight }}>{baseContent}</div>
  const hover = <div style={{
    lineHeight : 'normal'
  }}>
    {hoverContent}
  </div>

  return <HoverBox
    Base={base}
    Hover={hover}
  />;
}

export class BookingTimeGroupLocation extends ITimeTableDataContainer {

  /**
   * ITimeTableDataContainer for creating an table with:
   *         | Room_1   | Room_2   | ...
   * ------------------------------------
   * $Time_1 | bookings | bookings | ...
   * ------------------------------------
   * $Time_2 | bookings | bookings | ...
   *
   * @param {Map<Number, Booking>} all_bookings
   * @param {TracershopState} tracershopState
   * @param {Number} active_endpoint
   * @param {Date} active_date
   */
  constructor(all_bookings, tracershopState, active_endpoint, active_date){
    function cellFunction(bookings){
      return <BookingCell bookings={bookings}>;</BookingCell>
    }

    function columnNameFunction(location) {
      const name = location.common_name ? location.common_name : location.location_code;
      return <div>{name}</div>;
    }

    super(columnNameFunction, cellFunction);
    this.columns = toMapping(locationFilter(tracershopState, {
      active_endpoint : active_endpoint
    }, false))

    this.max_hour = 10;
    const bookings = bookingFilter(all_bookings, {
      state : tracershopState,
      active_endpoint : active_endpoint,
      active_date : active_date
    })

    for(const booking of bookings){
      if (!this.entryMapping.has(booking.location)){
        this.entryMapping.set(booking.location, new ArrayMap())
      }
      const bookingTimeStamp = new TimeStamp(booking.start_time);
      if(this.max_hour <= bookingTimeStamp.hour){
        this.max_hour = bookingTimeStamp.hour +1;
      }
      const locationArrayMap = this.entryMapping.get(booking.location);
      locationArrayMap.set(bookingTimeStamp.hour, booking);
      locationArrayMap.sortEntries(bookingTimeStamp.hour, (b1, b2) => b1.start_time > b2.start_time);
    }
  }
}

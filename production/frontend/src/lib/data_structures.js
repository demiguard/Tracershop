/**This module is creates different derived data structures used  by tracershop
 * A derived data structure is made from the Maps stored in the database
 * Many of these are equivalent to an SQL query.
*/

import React, {useRef, useState} from 'react'

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, Tracer, DeliveryEndpoint, Location, Procedure, ProcedureIdentifier, TracerCatalogPage, Customer, ReleaseRight, Isotope, TracershopState, User, InjectionOrder, IsotopeDelivery } from "../dataclasses/dataclasses"
import { ArrayMap } from "./array_map";
import { DateRange, TimeStamp, compareTimeStamp, datify, getDay, getWeekNumber } from "./chronomancy";
import { ORDER_STATUS, USER_GROUPS, WEEKLY_REPEAT_CHOICES, DAYS_OBJECTS } from "./constants";
import { activityOrderFilter, bookingFilter, injectionOrdersFilter, locationFilter, timeSlotFilter } from "./filters";
import { HoverBox } from "~/components/injectable/hover_box"
import { TIME_TABLE_CELL_HEIGHT_PIXELS } from "~/components/injectable/time_table"
import { getActiveTimeSlotID, getId, toMapping } from "./utils";
import { useTracershopState } from "~/contexts/tracer_shop_context"
import { useOverflow } from "~/effects/overflow"
import { HIGH_CONTRAST_ORDER_COLORS, JUSTIFY } from '~/lib/styles';
import { AccumulatingMap } from '~/lib/accumulating_map';
import { Col } from 'react-bootstrap';
import { formatAccessionNumber } from '~/lib/formatting';




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

  /**
   *
   * @param {DeliveryEndpoint} endpoint
   * @returns {ActivityDeliveryTimeSlot[]}
   */
  getTimeSlots(endpoint){
    return this._timeSlotMapping.get(endpoint.owner).get(endpoint.id)
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
  return timeSlotFilter(timeSlots, {endpointID : endpointID});
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
  /**@type {Number} 0000000 - 0000000 first seven bits are the days in odd  */ #chain

  /**
   * A data structure for evaluating if you can order at a date determined by
   * time slots.
   * @param {Array<ActivityDeliveryTimeSlot, IsotopeDelivery>} timeSlots - Time Slots determining
   * the bit chains
   * @param {TracershopState} state - All productions as
   * time slot refer to a production.
   */
  constructor(timeSlots, state){
    super();
    this.#chain = 0;

    // this doesn't scale...
    for(const timeSlot of timeSlots){
      if(timeSlot instanceof ActivityDeliveryTimeSlot){

        const production = state.production.get(timeSlot.production_run);

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
          this.#add_odd_weekday(production.production_day);
        }

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
          this.#add_even_weekday(production.production_day);
        }
      } else if(timeSlot instanceof IsotopeDelivery){
        const production = state.isotope_production.get(timeSlot.production);

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
          this.#add_odd_weekday(production.production_day);
        }
        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
          this.#add_even_weekday(production.production_day);
        }
      }
    }
  }

  eval(date){
    const oddWeekNumber = (getWeekNumber(date) % 2) == 1
    const day = getDay(date);

    return this.#chain & (1 << (day + Number(oddWeekNumber) * 7))
  }

  #add_even_weekday(day){
    this.#chain = this.#chain | (1 << day + 7);
  }

  #add_odd_weekday(day){
    this.#chain = this.#chain | (1 << day);
  }

  get chain() {
    return this.#chain
  }

  set chain(newChain) {
    this.#chain = newChain
  }
}

//#region Production Bit chain
export class ProductionBitChain extends BitChain {
  /**@type {Number} */ _chain

  /**
   * A data structure for figuring out if tracer is being produced at a day.
   * @param {Map<Number, ActivityProduction>} productions
   */
  constructor(productions){
    super()


    for(const production of productions.values()){
      this.chain = this.chain | (1 << production.production_day);
    }
  }

  eval(date){
    const day = getDay(date);

    return this.chain & (1 << day)
  }
}

//#region Order Date Mapping
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
 * @template T - Type of Generator element for the name of columns
 * @template U -
 */
export class ITimeTableDataContainer {
  /** @type {Map<Number, ArrayMap<Number, U>>}*/ entryMapping
  /** @type {Map<Number, T>}*/ columns
  /** @type {(T) => Element} */ columnNameFunction
  /** @type {([U], Number) => Element} */ cellFunction
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
      <div>{formatAccessionNumber(booking.accession_number)}</div>
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
//#region BookingTimeGroupLocation
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
      return <BookingCell bookings={bookings}/>
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
      locationArrayMap.sortEntries(bookingTimeStamp.hour, (b1, b2) => b1.start_time > b2.start_time ? 1 : -1);
    }
  }
}


/**
 *
 * @param {{
 *   orders : Array<ActivityOrder | InjectionOrder>,
 *   state : TracershopState
 * }} param0
 * @returns
 */
function WeeklyOrderHour({orders, state, testid}){
  let minimum_status = ORDER_STATUS.EMPTY;

  const activity_tracer_mapping = new AccumulatingMap();
  const injection_tracer_mapping = new AccumulatingMap();

  for(const order of orders){
    minimum_status = Math.min(order.status, minimum_status);
    if(order instanceof ActivityOrder){
      const deliveryTime = state.deliver_times.get(getActiveTimeSlotID(order));
      const production = state.production.get(deliveryTime.production_run);
      activity_tracer_mapping.set(production.tracer, order.ordered_activity)
    } else if (order instanceof InjectionOrder) {
      injection_tracer_mapping.set(order.tracer, order.injections);
    } else { /* istanbul ignore next */
      throw "Type violation! order is not an Activity order or injection"
    }
  }

  const tracerRows = [];

  for(const [tracerID, amount] of activity_tracer_mapping){
    const tracer = state.tracer.get(tracerID);

    tracerRows.push(<p
      style={{...JUSTIFY.center }}
      key={tracer.id}>
        {tracer.shortname}: {Math.floor(amount)} MBq
      </p>);
  }

  for(const [tracerID, injections] of injection_tracer_mapping){
    const tracer = state.tracer.get(tracerID);
    tracerRows.push(<p
      data-testid={`paragraph-${tracer.id}`}
      style={{...JUSTIFY.center}}
      key={tracer.id}>{tracer.shortname}: {injections} injektioner</p>);
  }

  return <Col
  data-testid={`Cell-${testid}`}
  style={{
    backgroundColor : HIGH_CONTRAST_ORDER_COLORS[minimum_status],
    border : "1px",
    borderStyle : "solid",
    padding : "0px",
  }}>{tracerRows}</Col>
}

//#region WeeklyOrderOverview
export class WeeklyOrderOverview extends ITimeTableDataContainer {
  /**
   *
   * @param {TracershopState} state
   * @param {DateRange} weeklyRange
   */
  constructor(state, weeklyRange){
    const /** @type {Array<ActivityOrder>} */ activityOrders = activityOrderFilter(state, {
      dateRange : weeklyRange,
      state : state
    }).filter((order) => order.status != ORDER_STATUS.CANCELLED );

    const /** @type {Array<InjectionOrder>} */ injectionOrders = injectionOrdersFilter(state, {
      state : state, dateRange : weeklyRange
    }).filter((order) => order.status != ORDER_STATUS.CANCELLED );

    function columnNameFunction(columnName){
      return <div style={JUSTIFY.center}>{columnName}</div>
    }

    function cellFunction(orders, i){
      return <WeeklyOrderHour key={i} orders={orders} state={state} testid={i}/>
    }

    let min_hour = 24;
    let max_hour = 0;

    super(columnNameFunction, cellFunction);
    this.columns = new Map([
      [0, DAYS_OBJECTS[0].name],
      [1, DAYS_OBJECTS[1].name],
      [2, DAYS_OBJECTS[2].name],
      [3, DAYS_OBJECTS[3].name],
      [4, DAYS_OBJECTS[4].name],
      [5, DAYS_OBJECTS[5].name],
      [6, DAYS_OBJECTS[6].name],
    ]);

    for(const order of activityOrders){
      const timeSlot = state.deliver_times.get(getActiveTimeSlotID(order))
      const deliveryTimeStamp = new TimeStamp(timeSlot.delivery_time);
      const orderDay = getDay(datify(order.delivery_date));
      if(!this.entryMapping.has(orderDay)){
        this.entryMapping.set(orderDay, new ArrayMap());
      }
      const dayMap = this.entryMapping.get(orderDay);
      dayMap.set(deliveryTimeStamp.hour, order)
      min_hour = Math.min(min_hour, deliveryTimeStamp.hour);
      max_hour = Math.max(max_hour, deliveryTimeStamp.hour);
    }

    for(const order of injectionOrders){
      const deliveryTimeStamp = new TimeStamp(order.delivery_time);
      const orderDay = getDay(datify(order.delivery_date));
      if(!this.entryMapping.has(orderDay)){
        this.entryMapping.set(orderDay, new ArrayMap());
      }
      const dayMap = this.entryMapping.get(orderDay);
      dayMap.set(deliveryTimeStamp.hour, order);
      min_hour = Math.min(min_hour, deliveryTimeStamp.hour);
      max_hour = Math.max(max_hour, deliveryTimeStamp.hour);
    }

  const toBeDeletedColumns = new Set();
  for(const columnKey of this.columns.keys()){
    if(!this.entryMapping.has(columnKey)){
      toBeDeletedColumns.add(columnKey);
    }
  }

  for(const key of toBeDeletedColumns){
    this.columns.delete(key);
  }

  this.min_hour = min_hour;
  this.max_hour = max_hour
  }
}

/**
 * gets the owner of a time slot
 * @param {ActivityDeliveryTimeSlot} timeSlot - The timeslot you desire to find the owner of
 * @param {Map<Number, DeliveryEndpoint>} endpoints - Map of all known endpoints
 * @param {Map<Number, Customer>} customers - Map of all known customers
 * @return {Customer}
 */
export function getTimeSlotOwner(timeSlot, endpoints, customers){
  const endpoint = endpoints.get(timeSlot.destination)
  const customer = customers.get(endpoint.owner);
  if (customer === undefined){
    throw "Database Integrity violated!"
  }
  return customer
}

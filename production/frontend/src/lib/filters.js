/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, DeliveryEndpoint, Location, Tracer, TracershopState } from "../dataclasses/dataclasses";
import { getId } from "./utils";

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
  return (/** @type {Tracer} */ tracer) => tracer.tracer_type === tracerType && !tracer.archived
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
    if(!locations.has(booking.location)){
      return false;
    }
    const location = locations.get(booking.location);
    return booking.start_date === dateString && location.endpoint === activeEndpoint;
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

/**
 *
 * @param {TracershopState} state
 */
export function getRelevantActivityOrders(state, day, active_tracer, active_endpoint, activeDateString){
  const availableProductions =[...state.production.values()].filter(
    (production) => {
      return production.production_day === day && production.tracer === active_tracer
  }).map(getId);

  const availableTimeSlots = [...state.deliver_times.values()].filter(
    (timeSlot) => {
      const cond1 = availableProductions.includes(timeSlot.production_run)
      const cond2 = timeSlot.destination === active_endpoint;

      return cond1 && cond2;
    }).map(getId)

  const relevantActivityOrders = [...state.activity_orders.values()].filter(
      (activityOrder) => {
        const timeSlotConstraint = availableTimeSlots.includes(activityOrder.ordered_time_slot);
        return timeSlotConstraint && activeDateString === activityOrder.delivery_date;
    });


  return [availableProductions,availableTimeSlots, relevantActivityOrders]
}

export function locationEndpointFilter(active_endpoint){
  return (location) => {
    return location.endpoint === active_endpoint;
  }
}

/**
 *
 * @param {{
 *
 * }} param0
 * @returns
 */
export function productionsFilter({state, tracerID, day, ids = false}){
  const productions = []
  for(const production of state.production.values()){
    const tracerCondition = tracerID === undefined || production.tracer === tracerID;
    const dayCondition = day === undefined || production.day === day;

    if(tracerCondition && dayCondition){
      if(ids){
        productions.append(production.id);
      } else {
        productions.append(production);
      }
    }
  }
  return productions;
}

/**
 *
 * @param {TracershopState} state
 * @param {Number} TracerID
 * @param {Array<ActivityDeliveryTimeSlot>}
 */
export function timeSlotsFilter({state, tracerID, day, endpointID, ids = false}){


  const productionIDs = tracerID !== undefined ? productionsFilter({state : state,
                                                                    tracerID : tracerID,
                                                                    day : day,
                                                                    ids : true,
                                                                   }) : undefined;
  const timeSlots = []
  for(const timeSlot of state.deliver_times.values()){
    const tracerCondition = productionIDs !== undefined ?
      productionIDs.includes(timeSlot.id) : true;
    const endpointCondition = endpointID !== undefined ? timeSlot.destination == endpointID : true;

    if(tracerCondition && endpointCondition){
      if(ids){
        timeSlots.append(timeSlot.id)
      } else {
        timeSlots.append(timeSlot)
      }
    }
  }
  return timeSlots
}


export function activityOrdersForTracer({state, timeSlotFilterArgs, ids=false}){
  const timeSlotIDs = timeSlotFilterArgs !== undefined ? timeSlotsFilter({state : state,
                                       day : timeSlotFilterArgs.day,
                                       endpointID : timeSlotFilterArgs.endpointID,
                                       tracerID: timeSlotFilterArgs.tracerID,
                                       ids : true}) : undefined;
  const activityOrders = [];
  for(const activityOrder of state.activity_orders.values()){
    const timeSlotCondition = timeSlotIDs !== undefined ?
      timeSlotIDs.includes(activityOrder.ordered_time_slot) : true;

    if(timeSlotCondition){
      if(ids){
        activityOrders.push(activityOrder.id);
      } else {
        activityOrders.push(activityOrder);
      }
    }
  }

  return activityOrders
}
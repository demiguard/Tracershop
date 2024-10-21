/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

import { DATA_ACTIVITY_ORDER, DATA_BOOKING, DATA_DELIVER_TIME, DATA_INJECTION_ORDER, DATA_LOCATION, DATA_PRODUCTION, DATA_VIAL } from "~/lib/shared_constants";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, DeliveryEndpoint, InjectionOrder, Location, Procedure, Tracer, TracershopState, Vial } from "../dataclasses/dataclasses";
import { compareDates, getId } from "./utils";
import { DateRange, datify } from "~/lib/chronomancy";

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
 * Extracts an array from various container types.
 *
 * @template T
 * @param {TracershopState|Map<any, T>|Array<T>|T} container - The container to extract from.
 * @param {{new() : T}} type - The constructor function for type T.
 * @param {string} typeKeyword - The key to access the desired property in TracershopState.
 * @returns {Array<T>} The extracted array of type T.
 * @throws {string} Throws an error message if extraction is not possible.
 *
 * @description
 * This function attempts to extract an array of type T from different types of containers:
 * - If the container is a TracershopState and has the typeKeyword property, it returns the values of that property.
 * - If the container is a Map, it returns an array of its values.
 * - If the container is already an Array, it returns the container itself.
 * - If the container is an instance of the specified type, it returns an array containing the container.
 * - If none of the above conditions are met, it throws an error.
 */
export function extractData(container, type, typeKeyword){
  if(container instanceof TracershopState && typeKeyword in container){
    return [...container[typeKeyword].values()];
  } else if(container instanceof Map) {
    return [...container.values()];
  } else if(container instanceof Array){
    return container;
  } else if(container instanceof type){
    return [container];
  }
  throw `Unable to extract ${typeKeyword}`
}

export function procedureFilter(container, {
  tracerID,
  active_endpoint
}, ids=false){
  const /**@type {Array<Procedure>} */ procedures = extractData(container, Procedure, 'procedure')

    const filteredProcedures = procedures.filter((procedure) => {
      const tracer_condition = tracerID ? procedure.tracer === tracerID : true;
      const endpoint_condition = active_endpoint ? procedure.owner === active_endpoint : true;

      return tracer_condition && endpoint_condition;
    });

  if(ids){
    return filteredProcedures.map(getId);
  } else {
    return filteredProcedures;
  }
}

export function locationFilter(container, {
  active_endpoint
}, ids=false){
  const /**@type {Array<Location>} */ locations = extractData(
    container, Location, DATA_LOCATION
  );

  const filteredLocations = locations.filter((location) => {
    const endpoint_point = active_endpoint ? active_endpoint === location.endpoint : false;

    return endpoint_point;
  });

  if(ids){
    return filteredLocations.map(getId);
  } else {
    return filteredLocations;
  }
}

export function bookingFilter(container, {
  state,
  active_endpoint,
  active_date,
  tracer_id
}){
  const /**@type {Array<Booking>}*/ bookings = extractData(container, Booking, DATA_BOOKING);

  const locations = state && active_endpoint ? locationFilter(state, {active_endpoint : active_endpoint}, true) : undefined;
  const procedures = state && tracer_id ? procedureFilter(state, {
    tracerID : tracer_id, active_endpoint : active_endpoint
  }, true) : undefined;


  return bookings.filter((booking) => {
    const endpoint_condition = locations ? locations.includes(booking.location) : true;
    const date_condition = active_date ? compareDates(datify(active_date), datify(booking.start_date)) : true;
    const procedure_condition = procedures ? procedures.includes(booking.procedure) : true;;
    return endpoint_condition && date_condition && procedure_condition;
  });
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
 * A specialized activityOrderFilter, which also gets productions, time slots,
 * and orders
 * TODO: rename this
 * @param {TracershopState} state
 * @param {Day} day
 * @param {Number} active_tracer id of the active tracer
 * @param {Number} active_endpoint id of the active endpoint
 * @param {String} activeDateString String representing a date on the format
 * YYYY-MM-DD
 */
export function getRelevantActivityOrders(state,
                                          day,
                                          active_tracer,
                                          active_endpoint,
                                          activeDateString){
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
 * @param {
 *  @param container {TracershopState}
 *  @param productionFilterParams { tracerID : Number,
 *    day : Number,
 *    ids : Boolean,
 *  }} param0
 * @returns
 */
export function productionsFilter(container, {production_id, tracerID, day}, ids=false){
  const productions = extractData(container, ActivityProduction, DATA_PRODUCTION);
  const filteredProductions = productions.filter(
    (production) => {
      const tracerCondition = tracerID ? production.tracer === tracerID : true;
      const dayCondition = day ?  production.day === day : true;
      const idCondition = production_id ? production.id === production_id : true;

      return tracerCondition && dayCondition && idCondition
    }
  )
  if(ids){
    return filteredProductions.map(getId);
  } else {
    return filteredProductions;
  }
}

/**
 *
 * @param {TracershopState} container
 * @param {Number} TracerID
 * @param {Array<ActivityDeliveryTimeSlot>}
 */
export function timeSlotsFilter(container, {state, timeSlotId, tracerID, day, endpointID}, ids = false){
  const timeSlots = extractData(container, ActivityDeliveryTimeSlot, DATA_DELIVER_TIME)

  const productionIDs = tracerID && state ? productionsFilter(state, {
                                                                    tracerID : tracerID,
                                                                    day : day,
                                                                   }, true) : undefined;
  const filteredTimeSlots = timeSlots.filter((timeSlot) => {
    const tracerCondition = productionIDs ? productionIDs.includes(timeSlot.production_run) : true;
    const endpointCondition = endpointID? timeSlot.destination == endpointID : true;
    const idCondition = timeSlotId instanceof Array ? timeSlotId.includes(timeSlot.id) :
                        timeSlotId ? timeSlotId === timeSlot.id : true;

    return tracerCondition && endpointCondition && idCondition;
  });

  if(ids){
    return filteredTimeSlots.map(getId);
  } else {
    return filteredTimeSlots;
  }
}

/**
 *
 * @param {TracershopState} container
 * @param {{
 *  timeSlotFilterArgs,
 *  dateRange : DateRange | undefined
 * }} param1
 * @returns
 */
export function activityOrdersFilter(container, {state,
    timeSlotFilterArgs,
    status,
    dateRange,
    }, ids=false){
  const orders = extractData(container, ActivityOrder, DATA_ACTIVITY_ORDER)
  const timeSlotIDs = timeSlotFilterArgs && state ?
    timeSlotsFilter(state, {state : state, ...timeSlotFilterArgs}, true) : undefined;
  const filteredActivityOrders = orders.filter((order) => {
    const timeSlotCondition = timeSlotIDs ?
      timeSlotIDs.includes(order.ordered_time_slot) : true;
    const statusCondition = (() => {
        if(status instanceof Array){
          return status.includes(order.status)
        }
        if(status !== undefined){
          return order.status === status
        }
        return true;
      })();
    const dateRangeCondition = dateRange !== undefined ?
      dateRange.in_range(order.delivery_date) : true
    return timeSlotCondition && statusCondition && dateRangeCondition
  });

  if(ids){
    return filteredActivityOrders.map(getId);
  } else {
    return filteredActivityOrders;
  }
}

/**
 *
 * @param {TracershopState} container
 * @param {{
 *  status : Number | undefined
 *  dateRange : DateRange | undefined
 * }} param1
 * @param {Boolean} ids - if the array should return
 * @returns {Array<InjectionOrder> | Array<Number>}
 */
export function injectionOrdersFilter(container, {
  status,
  dateRange,
}, ids=false) {
  const injectionOrders = extractData(container, InjectionOrder, DATA_INJECTION_ORDER);

  const filteredInjectionOrders = injectionOrders.filter(
    (order) => {
      const statusCondition = (() => {
        if(status instanceof Array){
          return status.includes(order.status);
        }
        if(status !== undefined){
          return order.status === status;
        }

        return true;
      })();
      const dateRangeCondition = dateRange !== undefined ? dateRange.in_range(order.delivery_date) : true;

      return statusCondition && dateRangeCondition;
    }
  );

  if(ids){
    return filteredInjectionOrders.map(getId);
  } else {
    return filteredInjectionOrders;
  }
}

export function vialFilter(container, {
  active_date, active_tracer, orderIDs, active_customer
}, ids){
  const /**@type {Array<Vial>} */ vials = extractData(container, Vial, DATA_VIAL);

  const filteredVials = vials.filter((vial) => {
    const date_condition = active_date ? compareDates(datify(vial.fill_date), datify(active_date)) : true
    const tracer_condition = active_tracer ? vial.tracer === active_tracer : true;
    const orderIDs_condition = orderIDs ? orderIDs.includes(vial.assigned_to) : true;
    const customer_condition = active_customer ? active_customer === vial.owner : true;

    return date_condition && tracer_condition && orderIDs_condition && customer_condition;
  });


  if (ids){
    return filteredVials.map(getId);
  } else {
    return filteredVials;
  }
}

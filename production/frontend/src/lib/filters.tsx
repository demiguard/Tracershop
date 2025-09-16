/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

import { DATA_ACTIVITY_ORDER, DATA_BOOKING, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_ISOTOPE_DELIVERY, DATA_ISOTOPE_ORDER, DATA_ISOTOPE_PRODUCTION, DATA_ISOTOPE_VIAL, DATA_LOCATION, DATA_PRODUCTION, DATA_VIAL } from "~/lib/shared_constants";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Booking, DeliveryEndpoint, InjectionOrder, Isotope, IsotopeDelivery, IsotopeOrder, IsotopeProduction, IsotopeVial, Location, Procedure, Tracer, TracershopState, Vial } from "../dataclasses/dataclasses";
import { compareDates, getId } from "./utils";
import { DateRange, datify, sameDate } from "~/lib/chronomancy";
import { ORDER_STATUS } from "~/lib/constants";



export function tracerTypeFilter(tracerType){
  return (/** @type {Tracer} */ tracer) => tracer.tracer_type === tracerType && !tracer.archived
}

type ContainerType<T> = TracershopState | Map<any, T> | Array<T> | T

/**
 * Extracts an array from various container types.
 *
 * @template T
 * @param {TracershopState | Map<any, T> | Array<T> | T} container - The container to extract from.
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
export function extractData<T> (container: ContainerType<T>, type: {new() : T}, typeKeyword: string) : Array<T> {
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

type IsotopeFilterArgs = {
  state? : TracershopState,
  producible? : boolean,
}

export function isotopeFilter(container: ContainerType<Isotope>, filterArgs: IsotopeFilterArgs): Isotope[];
export function isotopeFilter(container: ContainerType<Isotope>, filterArgs: IsotopeFilterArgs, ids: true): number[];

export function isotopeFilter(
  container: ContainerType<Isotope>, {
    producible,
    state,
  } : IsotopeFilterArgs, ids = false
) {
  const isotopes = extractData(container, Isotope, DATA_ISOTOPE);
  const is_producible = (() => {
      if(state instanceof TracershopState && producible !== undefined){
        const producibleIsotopes = new Set();
        for(const isotopeProduction of state.isotope_production.values() ){
          producibleIsotopes.add(isotopeProduction.isotope);
        }

        return (isotope: Isotope) => producibleIsotopes.has(isotope.id);
      }

      return () => true;
    })()

  const filteredIsotopes = isotopes.filter((isotope) => {
    const producibleCondition = is_producible(isotope);

    return producibleCondition;
  });

  return ids ? filteredIsotopes.map(getId) :  filteredIsotopes;
}



export function procedureFilter(container: ContainerType<Procedure>, filterArgs: any) : Procedure[];
export function procedureFilter(container: ContainerType<Procedure>, filterArgs: any, ids: true) : number[];

export function procedureFilter(container : ContainerType<Procedure>, {
  tracerID,
  active_endpoint
}, ids=false){
  const procedures = extractData(container, Procedure, 'procedure')

    const filteredProcedures = procedures.filter((procedure) => {
      const tracer_condition = tracerID ? procedure.tracer === tracerID : true;
      const endpoint_condition = active_endpoint ? procedure.owner === active_endpoint : true;

      return tracer_condition && endpoint_condition;
    });

  return ids ? filteredProcedures.map(getId) : filteredProcedures
}

export function locationFilter(container: ContainerType<Location>, filterArgs: any): Location[]
export function locationFilter(container: ContainerType<Location>, filterArgs: any, ids: true): number[]

export function locationFilter(container: ContainerType<Location>, {
  active_endpoint
}, ids=false){
  const locations = extractData(
    container, Location, DATA_LOCATION
  );

  const filteredLocations = locations.filter((location) => {
    const endpoint_point = active_endpoint ? active_endpoint === location.endpoint : false;

    return endpoint_point;
  });

  return ids ? filteredLocations.map(getId) : filteredLocations;
}

export function bookingFilter(container: ContainerType<Booking>, filterArgs: any): Booking[]
export function bookingFilter(container: ContainerType<Booking>, filterArgs: any, ids: true): number[]

export function bookingFilter(container: ContainerType<Booking>, {
  state,
  active_endpoint,
  active_date,
  tracer_id
}, ids=false){
  const bookings = extractData(container, Booking, DATA_BOOKING);

  const locations = state && active_endpoint ? locationFilter(state, {active_endpoint : active_endpoint}, true) : undefined;
  const procedures = state && tracer_id ? procedureFilter(state, {
    tracerID : tracer_id, active_endpoint : active_endpoint
  }, true) : undefined;

  const filteredBookings = bookings.filter((booking) => {
    const endpoint_condition = locations ? locations.includes(booking.location) : true;
    const date_condition = active_date ? compareDates(datify(active_date), datify(booking.start_date)) : true;
    const procedure_condition = procedures ? procedures.includes(booking.procedure) : true;;
    return endpoint_condition && date_condition && procedure_condition;
  });

  return ids ? filteredBookings.map(getId) : filteredBookings;
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

type productionFilterArgs = {
  production_id? : number,
  tracerID? : number,
  day? : number
};


export function productionsFilter(container: ContainerType<ActivityProduction>, filterArgs: productionFilterArgs) : ActivityProduction[]
export function productionsFilter(container: ContainerType<ActivityProduction>, filterArgs: productionFilterArgs, ids: true) : number[]


export function productionsFilter(container: ContainerType<ActivityProduction>, {production_id, tracerID, day}: productionFilterArgs, ids=false){
  const productions = extractData(container, ActivityProduction, DATA_PRODUCTION);
  const filteredProductions = productions.filter(
    (production) => {
      const tracerCondition = tracerID ? production.tracer === tracerID : true;
      const dayCondition = day !== undefined ? production.production_day === day : true;
      const idCondition = production_id ? production.id === production_id : true;
      return tracerCondition && dayCondition && idCondition
    }
  )

  return ids ? filteredProductions.map(getId) : filteredProductions
}


export type TimeSlotFilterArgs = {
  state? : TracershopState,
  timeSlotId? : number | Array<number>,
  tracerID? : number, // Inconsistent naming :(
  day? : number,
  endpointID? : number

}

export function timeSlotFilter(container: ContainerType<ActivityDeliveryTimeSlot>, filterArgs: TimeSlotFilterArgs): ActivityDeliveryTimeSlot[]
export function timeSlotFilter(container: ContainerType<ActivityDeliveryTimeSlot>, filterArgs: TimeSlotFilterArgs, ids : true): number[]

export function timeSlotFilter(
    container: ContainerType<ActivityDeliveryTimeSlot>,
    {state, timeSlotId, tracerID, day, endpointID} : TimeSlotFilterArgs,
    ids = false
  ){
  const timeSlots = extractData(container, ActivityDeliveryTimeSlot, DATA_DELIVER_TIME)

  const productionIDs = tracerID && state ? productionsFilter(state, {
                                                                    tracerID : tracerID,
                                                                    day : day,
                                                                   }, true) : undefined;
  const filteredTimeSlots = timeSlots.filter((timeSlot) => {
    const tracerCondition = productionIDs ? productionIDs.includes(timeSlot.production_run) : true;
    const endpointCondition = endpointID ? timeSlot.destination == endpointID : true;
    const idCondition = timeSlotId instanceof Array ? timeSlotId.includes(timeSlot.id) :
                        timeSlotId ? timeSlotId === timeSlot.id : true;
{}
    return tracerCondition && endpointCondition && idCondition;
  });

  return ids ? filteredTimeSlots.map(getId) : filteredTimeSlots
}

export type IsotopeProductionFilterArgs = {
  day? : number,
  produces? : number
}

export function isotopeProductionFilter(container: ContainerType<IsotopeProduction>, filterArgs: IsotopeProductionFilterArgs) : IsotopeProduction[]
export function isotopeProductionFilter(container: ContainerType<IsotopeProduction>, filterArgs: IsotopeProductionFilterArgs, ids: true) : number[]

export function isotopeProductionFilter(container: ContainerType<IsotopeProduction>, {day, produces} : IsotopeProductionFilterArgs,ids=false) {
  const productions = extractData(container, IsotopeProduction, DATA_ISOTOPE_PRODUCTION);

  const filteredProductions = productions.filter((prod) => {
    const dayCondition = day !== undefined ? prod.production_day === day : true
    const productCondition = produces !== undefined ? prod.isotope === produces : true

    return dayCondition && productCondition;
  })


  return ids ? filteredProductions.map(getId) : filteredProductions;
}


type IsotopeDeliveryFilterArgs = {
  isotopeID? : number,
  endpointID? : number,
  state? : TracershopState,
  day? : number,
  production_id? : number
};

export function isotopeDeliveryFilter(container: ContainerType<IsotopeDelivery>, filterArgs: IsotopeDeliveryFilterArgs) : IsotopeDelivery[]
export function isotopeDeliveryFilter(container: ContainerType<IsotopeDelivery>, filterArgs: IsotopeDeliveryFilterArgs, ids: true) : number[]

export function isotopeDeliveryFilter(
    container: ContainerType<IsotopeDelivery>,
    { state, endpointID, isotopeID, day, production_id } : IsotopeDeliveryFilterArgs,
    ids=false
  ){
  const isotopeDeliveries = extractData(container, IsotopeDelivery, DATA_ISOTOPE_DELIVERY);

  const is_accepted_production = (() => {
    if(state instanceof TracershopState){
      const matchID = isotopeID ? (ip: IsotopeProduction) => {
        return ip.isotope === isotopeID
      } : () => true;

      const matchDay = day !== undefined ? (ip : IsotopeProduction) => {
        return ip.production_day === day
      } : () => true;


      const isotopeProductionIDs = new Set<Number>();

      for(const isotopeProduction of state.isotope_production.values()){
        if(matchID(isotopeProduction) && matchDay(isotopeProduction)){
          isotopeProductionIDs.add(isotopeProduction.id);
        }
      }

      return (isoDev: IsotopeDelivery) => isotopeProductionIDs.has(isoDev.production);
    }

    return (_: IsotopeDelivery) => true;
  })();

  const filteredIsotopeDeliveries = isotopeDeliveries.filter((isotopeDelivery) => {
    const deliveryCondition = endpointID ? isotopeDelivery.delivery_endpoint === endpointID : true;
    const productionCondition = is_accepted_production(isotopeDelivery);
    const is_specific_production = production_id ? isotopeDelivery.production === production_id : true

    return deliveryCondition && productionCondition && is_specific_production;
  })

  return ids ? filteredIsotopeDeliveries.map(getId) : filteredIsotopeDeliveries;
}

type IsotopeOrderFilterArgs = {
  state? : TracershopState,
  timeSlots? : Array<IsotopeDelivery>,
  delivery_date? : string,
  timeSlotFilterArgs? : IsotopeDeliveryFilterArgs,
};

export function isotopeOrderFilter(container: ContainerType<IsotopeOrder>, filterArgs: IsotopeOrderFilterArgs) : IsotopeOrder[]
export function isotopeOrderFilter(container: ContainerType<IsotopeOrder>, filterArgs: IsotopeOrderFilterArgs, ids: true) : number[]

export function isotopeOrderFilter(
  container: ContainerType<IsotopeOrder>, {
    state,
    timeSlots,
    timeSlotFilterArgs,
    delivery_date,
  } : IsotopeOrderFilterArgs, ids=false){
  const isotopeOrders = extractData(container, IsotopeOrder, DATA_ISOTOPE_ORDER);
  const timeSlotIDs =
    timeSlots !== undefined ? timeSlots.map(getId) : // If passed TimeSlots we use those
    timeSlotFilterArgs && state ? // Otherwise we can get the timesslots
      timeSlotFilter(state, {state : state, ...timeSlotFilterArgs}, true)
    : undefined; // Otherwise No filter over time slots

  const filteredIsotopeOrders = isotopeOrders.filter(
    (io) => {
      const timeSlotCondition = timeSlotIDs ? timeSlotIDs.includes(io.destination) : true;
      const deliveryDateCondition = delivery_date ?  io.delivery_date === delivery_date : true;

      return timeSlotCondition && deliveryDateCondition;
    }
  )

  return ids ? filteredIsotopeOrders.map(getId) : filteredIsotopeOrders;
}

type ActivityOrderFilterArgs = {
  state? : TracershopState,
  timeSlotFilterArgs? : any,
  timeSlots? : Array<ActivityDeliveryTimeSlot>,
  status? : ORDER_STATUS | Array<ORDER_STATUS>,
  delivery_date? : string,
  dateRange? : DateRange,
};

export function activityOrderFilter(container: ContainerType<ActivityOrder>, filterArgs: ActivityOrderFilterArgs): ActivityOrder[]
export function activityOrderFilter(container: ContainerType<ActivityOrder>, filterArgs: ActivityOrderFilterArgs, ids: true): number[]

export function activityOrderFilter(container: ContainerType<ActivityOrder>, {state,
    timeSlotFilterArgs,
    timeSlots,
    status,
    delivery_date,
    dateRange,
    }: ActivityOrderFilterArgs, ids=false){
  const orders = extractData(container, ActivityOrder, DATA_ACTIVITY_ORDER)

  const timeSlotIDs =
    timeSlots !== undefined ? timeSlots.map(getId) : // If passed TimeSlots we use those
    timeSlotFilterArgs && state ? // Otherwise we can get the timesslots
      timeSlotFilter(state, { state : state, ...timeSlotFilterArgs }, true)
    : undefined; // Otherwise No filter over time slots

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

    const dateRangeCondition =
      dateRange !== undefined ? dateRange.in_range(order.delivery_date) :
        delivery_date ? delivery_date === order.delivery_date : true;

    return timeSlotCondition && statusCondition && dateRangeCondition
  });

  return ids ? filteredActivityOrders.map(getId) : filteredActivityOrders
}

export function injectionOrdersFilter(container: ContainerType<InjectionOrder>, filterArgs: any): InjectionOrder[];
export function injectionOrdersFilter(container: ContainerType<InjectionOrder>, filterArgs: any, ids: true): number[];

export function injectionOrdersFilter(container: ContainerType<InjectionOrder>, { status, dateRange }, ids=false) {
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

  return ids ? filteredInjectionOrders.map(getId) : filteredInjectionOrders;
}

export function vialFilter(container: ContainerType<Vial>, filterArgs: any) : Vial[]
export function vialFilter(container: ContainerType<Vial>, filterArgs: any, ids: true) : number[]

export function vialFilter(container: ContainerType<Vial>, {
  active_date, active_tracer, orderIDs, active_customer
}, ids=false){
  const vials = extractData(container, Vial, DATA_VIAL);

  const filteredVials = vials.filter((vial) => {
    const date_condition = active_date ? compareDates(datify(vial.fill_date), datify(active_date)) : true
    const tracer_condition = active_tracer ? vial.tracer === active_tracer : true;
    const orderIDs_condition = orderIDs ? orderIDs.includes(vial.assigned_to) : true;
    const customer_condition = active_customer ? active_customer === vial.owner : true;

    return date_condition && tracer_condition && orderIDs_condition && customer_condition;
  });

  return ids ? filteredVials.map(getId) : filteredVials;
}

export function endpointFilter(container: ContainerType<DeliveryEndpoint>, filterArgs: any): DeliveryEndpoint[]
export function endpointFilter(container: ContainerType<DeliveryEndpoint>, filterArgs: any, ids: true): number[]

export function endpointFilter(container: ContainerType<DeliveryEndpoint>, {
  owner
}, ids=false){
  const endpoints = extractData(container, DeliveryEndpoint, DATA_ENDPOINT);

  const filteredEndpoints = endpoints.filter((endpoint) => {
    const owner_condition = owner ? owner === endpoint.owner : true
    return owner_condition;
  })

  return ids ? filteredEndpoints.map(getId) : filteredEndpoints;
}

type IsotopeVialFilterArgs = {
  date? : Date
  dateRange? : DateRange,
  isotopeID? : Number
  isEmpty? : true,
  deliveredTo? : Array<number>
};

export function isotopeVialFilter(container: ContainerType<IsotopeVial>, filterArgs: IsotopeVialFilterArgs) : IsotopeVial[]
export function isotopeVialFilter(container: ContainerType<IsotopeVial>, filterArgs: IsotopeVialFilterArgs, ids: true) : number[]

export function isotopeVialFilter(
  container: ContainerType<IsotopeVial>,
  { date, dateRange, isotopeID, isEmpty, deliveredTo }: IsotopeVialFilterArgs,
  ids=false
){
  const isotopeVials = extractData(container, IsotopeVial, DATA_ISOTOPE_VIAL);

  const filteredVials = isotopeVials.filter((isotopeVial) => {
    const dateCondition = date ? sameDate(date, datify(isotopeVial.calibration_datetime)) : true;
    const dateRangeCondition = dateRange ? dateRange.in_range(isotopeVial.calibration_datetime) : true;

    const isotopeCondition = isotopeID ? isotopeVial.isotope === isotopeID : true;
    // delivery_with with should be a fk, null or undefined,
    const isEmptyCondition = isEmpty ? !(isotopeVial.delivery_with) : true;
    const deliveredToCondition = deliveredTo ? deliveredTo.includes(isotopeVial.delivery_with) : true;


    return dateCondition && dateRangeCondition && isotopeCondition && isEmptyCondition && deliveredToCondition;
  });


  return ids ? filteredVials.map(getId) : filteredVials;
}

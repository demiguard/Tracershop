/**These functions should define orders between custom dataclasses
 * Also Remember Currying and Closure
*/

import { ActivityDeliveryTimeSlot, DeliveryEndpoint, TracershopState } from "../dataclasses/dataclasses";

/**
 * @enum {Number}
 */
export const PROCEDURE_SORTING = {
  PROCEDURE_CODE : 0,
  TRACER : 1,
  UNITS : 2,
  DELAY : 3,
}

const GREATER = 1;
const LESSER = -1;

/**
 *
 * @param {TracershopState} state
 * @param {PROCEDURE_SORTING} sortingMethod
 * @returns
 */
export function sort_procedures(state, sortingMethod){
  return (prod_1, prod_2) => {
    switch (sortingMethod) {
      case PROCEDURE_SORTING.PROCEDURE_CODE:
        if (prod_1.series_description === null){
          return 1;
        }
        if (prod_2.series_description === null){
          return -1;
        }
        const pi_1 = state.procedure_identifier.get(prod_1.series_description);
        const pi_2 = state.procedure_identifier.get(prod_2.series_description);

        return pi_1.description > pi_2.description ? GREATER : LESSER;
      case PROCEDURE_SORTING.TRACER:
        if (prod_1.tracer === null) return GREATER
        if (prod_2.tracer === null) return LESSER
        return prod_1.tracer - prod_2.tracer;
      case PROCEDURE_SORTING.UNITS:
        return prod_1.tracer_units - prod_2.tracer_units;
      case PROCEDURE_SORTING.DELAY:
        return prod_1.delay_minutes - prod_2.delay_minutes;
      default:
        throw "UNDEFINED SORTING METHOD!"
    }
  }
}


/**
 * Sorts the display order of ActivityDeliveryTimeSlots such that they are
 * grouped in:
 * 1. By Customer
 * 2. By Endpoint
 * 3. Sorted by delivery time, earlier time is first
 * and cancelled orders must be sorted last
 * @param {Map<Number, DeliveryEndpoint>} endpoints
 * @returns {CallableFunction}
 */
export function sortTimeSlots(endpoints){
  return (/** @type {ActivityDeliveryTimeSlot} */ timeSlot_a,
          /** @type {ActivityDeliveryTimeSlot} */ timeSlot_b) => {

    const /**@type {DeliveryEndpoint} */ endpoint_a = endpoints.get(timeSlot_a.destination);
    const /**@type {DeliveryEndpoint} */ endpoint_b = endpoints.get(timeSlot_b.destination);

    if(endpoint_a.owner != endpoint_b.owner){
      return endpoint_a.owner - endpoint_b.owner
    }
    if(timeSlot_a.destination != timeSlot_b.destination){
      return timeSlot_a.destination - timeSlot_b.destination
    }

    return  timeSlot_b.delivery_time < timeSlot_a.delivery_time ? GREATER : LESSER;
  }
}

export const BOOKING_SORTING_METHODS = {
  START_TIME: 0, // This the default
  ACCESSION_NUMBER : 1,
  SERIES_DESCRIPTION : 2,
  LOCATION : 3
};

/**
 *
 * @param {BOOKING_SORTING_METHODS} sortingMethod
 * @param {TracershopState | undefined} state
 * @returns
 */
export function sortBookings(sortingMethod=BOOKING_SORTING_METHODS.START_TIME, state=undefined, invert=1){
  function defaultBookingSort(booking_1, booking_2){
    return booking_2.start_time < booking_1.start_time ? GREATER * invert : LESSER * invert;
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.ACCESSION_NUMBER){
    return (booking_1, booking_2) =>
      booking_2.accession_number < booking_1.accession_number ? GREATER * invert : LESSER * invert
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.SERIES_DESCRIPTION){
    if(state === undefined){
      throw "Cannot sort bookings based on Series Description without Tracershop state"
    }
    return (booking_1, booking_2) => {
      if(booking_1.procedure === booking_2.procedure){
        return defaultBookingSort(booking_1, booking_2);
      }

      if(!booking_1.procedure){
        return LESSER * invert;
      }
      if(!booking_2.procedure){
        return GREATER * invert;
      }

      const procedure_1 = state.procedure.get(booking_1.procedure);
      const procedure_2 = state.procedure.get(booking_2.procedure);
      if(!procedure_1 || !procedure_1.series_description){
        return LESSER * invert;
      }
      if(!procedure_2 || !procedure_2.series_description){
        return GREATER * invert;
      }

      const procedure_identifier_1 = state.procedure_identifier.get(procedure_1.series_description);
      const procedure_identifier_2 = state.procedure_identifier.get(procedure_2.series_description);

      if(!procedure_identifier_1.description){
        return LESSER * invert;
      }
      if(!procedure_identifier_2.description){
        return GREATER * invert;
      }

      return procedure_identifier_2.description < procedure_identifier_1.description ? GREATER * invert : LESSER * invert;
    }
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.LOCATION){
    if(state === undefined){
      throw "Cannot sort bookings based on Series Description without Tracershop state"
    }
    return (booking_1, booking_2) => {
      const location_1 = state.location.get(booking_1.location);
      const location_2 = state.location.get(booking_2.location);

      if(location_1 === undefined){
        return LESSER * invert;
      }
      if(location_2 === undefined){
        return GREATER * invert;
      }

      if(location_2.id === location_1.id){
        return defaultBookingSort(booking_1, booking_2);
      }

      if(!location_1.common_name){
        return LESSER * invert;
      }
      if(!location_2.common_name){
        return GREATER * invert;
      }

      return location_2.common_name < location_1.common_name ? GREATER * invert : LESSER * invert;
    }
  }

  if(sortingMethod !== BOOKING_SORTING_METHODS.START_TIME){
    console.log("Unknown input sorting method, using default!")
  }
  return defaultBookingSort;
}

export const InjectionOrderSortingMethods = {
  STATUS : 0,
  ORDER_ID : 1,
  DESTINATION : 2,
  TRACER : 3,
  INJECTIONS : 4,
  USAGE : 5,
  ISOTOPE : 6,
  ORDERED_TIME : 7
}

export function sortInjectionOrders(sortingMethod, invertedSorting, state){
  const invert = invertedSorting ? -1 : 1;

  switch(sortingMethod){
    case InjectionOrderSortingMethods.STATUS:
      return (injection_order_1, injection_order_2) =>
          invert * (injection_order_2.status - injection_order_1.status)

    case InjectionOrderSortingMethods.ORDER_ID:
      return (a,b) => invertedSorting * (b.id - a.id);
    case InjectionOrderSortingMethods.DESTINATION: return (a,b) => {
      const aEndpoint = state.delivery_endpoint.get(a.endpoint);
      const aCustomer = state.customer.get(aEndpoint.owner);
      const bEndpoint = state.delivery_endpoint.get(b.endpoint);
      const bCustomer = state.customer.get(bEndpoint.owner);

      return aCustomer.id != bCustomer.id ?
          invert * (bCustomer.id - aCustomer.id)
        : invert * (bEndpoint.id - aEndpoint.id);
      }
    case InjectionOrderSortingMethods.TRACER:
      return (a,b) => invert * (b.tracer - a.tracer);
    case InjectionOrderSortingMethods.INJECTIONS:
      return (a,b) => invert * (b.injections - a.injections);
    case InjectionOrderSortingMethods.USAGE:
      return (a,b) => invert * (b.tracer_usage - a.tracer_usage);
    case InjectionOrderSortingMethods.ISOTOPE:
      return (a,b) => invert * (b.isotope - a.isotope);
    case InjectionOrderSortingMethods.ORDERED_TIME:
      return (a,b) => invert * (b.delivery_time < a.delivery_time ? GREATER : LESSER);
  }
}
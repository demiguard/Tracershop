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


/**
 *
 * @param {TracershopState} state
 * @param {PROCEDURE_SORTING} sortingMethod
 * @returns
 */
export function sort_procedures(state, sortingMethod){
  return (prod_1, prod_2) => {
    switch (sortingMethod) {
      case PROCEDURE_SORTING.PROCEDURE_CODE:{
        if (prod_1.series_description === null) return 1;
        if (prod_2.series_description === null) return -1;
        const pi_1 = state.procedure_identifier.get(prod_1.series_description);
        const pi_2 = state.procedure_identifier.get(prod_2.series_description);
        return pi_1.description > pi_2.description;
      }
      case PROCEDURE_SORTING.TRACER:
        if (prod_1.tracer === null) return 1
        if (prod_2.tracer === null) return -1
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

    return  timeSlot_b.delivery_time < timeSlot_a.delivery_time ? 1 : -1;
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
export function sortBookings(sortingMethod=BOOKING_SORTING_METHODS.START_TIME, state=undefined){
  function defaultBookingSort(booking_1, booking_2){
    return booking_2.start_time < booking_1.start_time;
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.ACCESSION_NUMBER){
    return (booking_1, booking_2) =>
      booking_2.accession_number < booking_1.accession_number
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.SERIES_DESCRIPTION){
    if(state === undefined){
      throw "Cannot sort bookings based on Series Description without Tracershop state"
    }
    return (booking_1, booking_2) => {
      if(!booking_1.procedure){
        return false;
      }
      if(!booking_2.procedure){
        return true;
      }

      const procedure_1 = state.procedure.get(booking_1.procedure);
      const procedure_2 = state.procedure.get(booking_2.procedure);
      if(!procedure_1 || !procedure_1.series_description){
        return false;
      }
      if(!procedure_2 || !procedure_1.series_description){
        return true;
      }

      const procedure_identifier_1 = state.procedure_identifier.get(procedure_1.series_description);
      const procedure_identifier_2 = state.procedure_identifier.get(procedure_2.series_description);

      if(!procedure_identifier_1.description){
        return false;
      }
      if(!procedure_identifier_2.description){
        return true;
      }
      if(procedure_identifier_1.description === procedure_identifier_2.description){
        return defaultBookingSort(booking_1, booking_2);
      }

      return procedure_identifier_2.description < procedure_identifier_1.description;
    }
  }

  if(sortingMethod === BOOKING_SORTING_METHODS.LOCATION){
    if(state === undefined){
      throw "Cannot sort bookings based on Series Description without Tracershop state"
    }
    return (booking_1, booking_2) => {
      const location_1 = state.location.get(booking_1.location);
      const location_2 = state.location.get(booking_2.location);

      if(!location_1.common_name){
        return false;
      }
      if(!location_2.common_name){
        return true;
      }
      if(location_2.common_name === location_1.common_name){
        return defaultBookingSort(booking_1, booking_2);
      }
      return location_2.common_name < location_1.common_name;
    }
  }

  if(sortingMethod !== BOOKING_SORTING_METHODS.START_TIME){
    console.error("Unknown input sorting method, using default!")
  }
  return defaultBookingSort;
}
/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

export function dayTracerFilter(day, tracerID){
  return (production) => {
    return production.production_day === day && production.tracer === tracerID
  }
}

export function timeSlotOwnerFilter(endpointID){
  return (timeSlot) => timeSlot.destination === endpointID;
}

/** Function used 
 * 
 * @param {Number} CustomerID 
 * @returns 
 */
export function endpointOwnerFilter(CustomerID){
  return (endpoint) => endpoint.owner === CustomerID
}

export function applyFilter(collection, filterFunction) {
  return (collection instanceof Map) ?
    [...collection.values()].filter(filterFunction) :
    collection.filter(filterFunction);
}
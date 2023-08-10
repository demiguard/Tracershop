/**These functions should do some non trivial filtering
 * In general they should be used in Array.filter calls.
 */

export function dayTracerFilter(day, tracerID){
  return (production) => {
    return production.production_day === day && production.tracer === tracerID
  }
}
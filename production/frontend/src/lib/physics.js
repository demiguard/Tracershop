import { ActivityOrder, IsotopeVial, TracershopState, Vial } from "~/dataclasses/dataclasses";
import { compareTimeStamp, TimeStamp } from "~/lib/chronomancy";

export function CountMinutes(past,future) {
  // It's assumed that this is the same day
  if(past.getFullYear() != future.getFullYear() || past.getMonth() != future.getMonth() || past.getDate() != future.getDate()){
    throw "Past and Future is not same day";
  }
  const hours = future.getHours() - past.getHours()
  return hours * 60 + future.getMinutes() - past.getMinutes()
}

/** Calculates the amount of radioactive material is needed, if a certain amount is required after a time period
 *
 * NB: my docs here is bad
 * @param {Number} halflife - Halflife in seconds of the radioactive isotope
 * @param {Number} minutes - The amount of minutes the material is waiting
 * @param {Number} MBQ - The desired amount of activity after the time period.
 * @returns {Number} - MBq needed at the previous time.
 */
export function decayCorrect(halflife, minutes, MBQ) {
  const hf_in_min = halflife / 60

  return MBQ / Math.pow(1/2,  minutes / hf_in_min)
}

/** Calculates the activity need to fulfill an order without overhead
 *
 * @param {ActivityOrder} order
 * @param {TracershopState} state
 * @returns {Number}
 */
export function fulfillmentActivity(order, state){
  if(order.moved_to_time_slot == null){
    return order.ordered_activity;
  }

  const moveTimeSlot = state.deliver_times.get(order.moved_to_time_slot);
  const baseTimeSlot = state.deliver_times.get(order.ordered_time_slot);

  const moveTimeStamp = new TimeStamp(moveTimeSlot.delivery_time);
  const baseTimeStamp = new TimeStamp(baseTimeSlot.delivery_time);

  const production = state.production.get(baseTimeSlot.production_run);
  const tracer = state.tracer.get(production.tracer);
  const isotope = state.isotopes.get(tracer.isotope);

  const timeDifference = compareTimeStamp(baseTimeStamp, moveTimeStamp).toMinutes();

  return Math.floor(decayCorrect(isotope.halflife_seconds, timeDifference, order.ordered_activity))
}

/**
 *
 * @param {Vial} vial
 * @param {any} time
 */
export function correctVialActivityToTime(vial, time, halflife_seconds){
  const timeStamp = new TimeStamp(time)
  const vialTimeStamp = new TimeStamp(vial.fill_time);

  const diffTimeStamp = compareTimeStamp(timeStamp, vialTimeStamp);

  const minutes_delay = diffTimeStamp.toMinutes()

  return 0 < minutes_delay ?
      decayCorrect(halflife_seconds, minutes_delay, vial.activity)
    : vial.activity;
}

/**
 *
 * @param {IsotopeVial} vial
 * @param {any} time
 */
export function correctIsotopeVialActivityToTime(vial, time, halflife_seconds){
  const timeStamp = new TimeStamp(time)
  const vialDate = new Date(vial.calibration_datetime)

  const vialTimeStamp = new TimeStamp(vialDate);
  const diffTimeStamp = compareTimeStamp(timeStamp, vialTimeStamp);

  const minutes_delay = diffTimeStamp.toMinutes()

  return 0 < minutes_delay ?
      decayCorrect(halflife_seconds, minutes_delay, vial.vial_activity)
    : vial.vial_activity;
}
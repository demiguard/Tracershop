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
export function CalculateProduction(halflife, minutes, MBQ) {
  const hf_in_min = halflife / 60

  return MBQ / Math.pow(1/2,  minutes / hf_in_min)
}

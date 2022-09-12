export { CountMinutes, CalculateProduction}

function CountMinutes(past,future) {
  // It's assumed that this is the same day
  if(past.getFullYear() != future.getFullYear() || past.getMonth() != future.getMonth() || past.getDate() != future.getDate()){
    throw "Past and Future is not same day";
  }
  const hours = future.getHours() - past.getHours()
  return hours * 60 + future.getMinutes() - past.getMinutes()
}

function CalculateProduction(halflife, minutes, MBQ) {
  const hf_in_min = halflife / 60

  return MBQ / Math.pow(1/2,  minutes / hf_in_min)
}

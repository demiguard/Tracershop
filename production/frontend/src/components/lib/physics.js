export { CountMinutes, CalculateProduction}

const HALFLIFE = {
  FDG : 109.771
}

function CountMinutes(past,future) {
  // It's assumed that this is the same day
  const hours = future.getHours() - past.getHours()
  return hours * 60 + future.getMinutes() - past.getMinutes()
}

function CalculateProduction(Tracer, minutes, MBQ) {
  if (!(Tracer in HALFLIFE)) throw "Tracer is not known"
  
  const hf = HALFLIFE[Tracer]

  return MBQ / Math.pow(1/2,  minutes / hf)
}
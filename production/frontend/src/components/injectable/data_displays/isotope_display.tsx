import React from 'react'
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { Isotope } from '~/dataclasses/dataclasses';


type IsotopeDisplayProps = {
  isotope : number | Isotope
}

export function IsotopeDisplay({ isotope }){
  const state = useTracershopState();
  const isotopeObject = isotope instanceof Isotope ?
  isotope : state.isotopes.get(isotope)

  return `${isotopeObject.atomic_letter}-${isotopeObject.atomic_mass}${
    isotopeObject.metastable ? "m" : ""
  }`
}

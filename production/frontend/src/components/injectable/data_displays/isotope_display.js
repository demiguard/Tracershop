import React from 'react'
import { useTracershopState } from '~/components/tracer_shop_context'
import { Isotope } from '~/dataclasses/dataclasses';


/**
 *
 * @param {number | Isotope} isotope
 * @returns
 */
export function IsotopeDisplay({isotope}){
  const state = useTracershopState();
  const /**@type {Isotope} */ isotopeObject = isotope instanceof Isotope ?
  isotope : state.isotopes.get(isotope)

  return <div>{isotopeObject.atomic_letter} - {isotopeObject.atomic_mass}{
    isotopeObject.metastable ? "m" : ""
  }</div>

}
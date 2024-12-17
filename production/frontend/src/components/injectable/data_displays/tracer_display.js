import React from 'react'
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { Tracer } from '~/dataclasses/dataclasses'
import { HoverBox } from '../hover_box';

export function TracerDisplay({tracer}){
  const state = useTracershopState();
  if (tracer instanceof Number){
    tracer = state.tracer.get(tracer)
  }
  const isotope = state.isotopes.get(tracer.isotope);

  const clinicalName = (tracer.clinical_name != "") ?
  `${tracer.clinical_name} - ${isotope.atomic_letter}-${isotope.atomic_mass}`
  : "IUPAC navn for denne tracer er ikke angivet!";

  return(<HoverBox
    Base={<div>{tracer.shortname}</div>}
    Hover={<div>{clinicalName}</div>}
  />);
}
import React from 'react'
import { useTracershopState } from '~/components/tracer_shop_context'
import { Tracer } from '~/dataclasses/dataclasses'
import { HoverBox } from '../hover_box';

export function TracerDisplay({tracer}){
  if (tracer instanceof Number){
    const state = useTracershopState();
    tracer = state.tracer.get(tracer)
  }
  const clinicalName = (tracer.clinical_name != "") ?
  `${tracer.clinical_name} - ${isotope.atomic_letter}-${isotope.atomic_mass}`
  : "IUPAC navn for denne tracer er ikke angivet!";

  return(<HoverBox
    Base={<div>{tracer.shortname}</div>}
    Hover={<div>{clinicalName}</div>}
  />);
}
import React from 'react'
import { useTracershopState } from '~/contexts/tracer_shop_context'

import { ProductReference } from '~/dataclasses/references/product_reference';


type IsoTopeTableArgs = {
  product : ProductReference
}

export function IsotopeTable({product}){
  const state = useTracershopState();




  return <div></div>
}
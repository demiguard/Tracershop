import React from 'react'
import { ButtonRow } from '~/components/injectable/button_row'
import { useTracershopState } from '~/contexts/tracer_shop_context'
import { ProductReference } from '~/dataclasses/references/product_reference'





export function ProductButton({
  ProductReference
}){
  const state = useTracershopState();

  product

  return <Button>

  </Button>
}

/**
 *
 * @param {Object} props
 * @param {Array<ProductReference>} productReferences
 * @returns
 */
export function ProductRow({
  productReferences
}){

  const buttons = productReferences.map(
    (productRef, i) => <ProductButton key={i} ProductReference={productRef}/>
  );


  return <ButtonRow>
    {buttons}
  </ButtonRow>
}
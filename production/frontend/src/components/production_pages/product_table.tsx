import React, { JSX } from 'react'
import { ActivityTable } from '~/components/production_pages/activity_table'
import { IsotopeTable } from '~/components/production_pages/isotope_table'
import { PRODUCT_TYPES, ProductReference } from '~/dataclasses/references/product_reference'

type ProductTableArgs = {
  product : ProductReference
}

export function ProductionTable({product} : ProductTableArgs) : JSX.Element{
  switch(product.type){
    case PRODUCT_TYPES.ACTIVITY:{
      return (
        <ActivityTable active_tracer={product.product_id}/>
      );
    }
    case PRODUCT_TYPES.ISOTOPE:{
      return <IsotopeTable product={product}/>
    }


    default:
      return <div></div>
  }
}

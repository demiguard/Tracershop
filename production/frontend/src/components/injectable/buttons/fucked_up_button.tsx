/** This is the button you pressed when somebody did done the fuck up!
 */

import React from 'react'
import { OrderCollection } from '~/lib/data_structures/order_collection'
import { CancelButton } from '../cancel_button'
import { ORDER_STATUS } from '~/lib/constants'
import { CorrectButton } from './correct_button'
import { UncancelButton } from './uncancel_button'

type FuckUpProps = {
  collection : OrderCollection
}

export function FuckedUpButton({collection} : FuckUpProps){
  switch(collection.minimum_status){
    case ORDER_STATUS.CANCELLED:
      return <UncancelButton collection={collection}/>
    case ORDER_STATUS.RELEASED:
      return <CorrectButton collection={collection}/>
    default:
      return <CancelButton orders={collection.orders}/>
  }
}

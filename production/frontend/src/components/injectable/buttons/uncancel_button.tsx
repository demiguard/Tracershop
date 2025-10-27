import React from 'react'
import { Button } from 'react-bootstrap'
import { useWebsocket } from '~/contexts/tracer_shop_context'
import { ORDER_STATUS } from '~/lib/constants'
import { OrderCollection } from '~/lib/data_structures/order_collection'
import { getOrderType } from '~/lib/types'
import { IdempotentButton } from '../buttons'

type UncancelButtonProps = {
  collection : OrderCollection
}

export function UncancelButton({
  collection
} : UncancelButtonProps){
  const websocket = useWebsocket();

  function uncancel(){
    const updated_models = []
    for(const model of collection.orders){
      updated_models.push(
        {...model, status : ORDER_STATUS.ACCEPTED}
      );
    }

    return websocket.sendEditModel(
      getOrderType({collection : collection}), updated_models
    );
  }

  return <IdempotentButton onClick={uncancel}>
    Uafvis
  </IdempotentButton>
}
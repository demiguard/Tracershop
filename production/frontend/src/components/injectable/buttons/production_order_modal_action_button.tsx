import React, {} from 'react'
import { Button, ButtonProps } from 'react-bootstrap';
import { useWebsocket } from '~/contexts/tracer_shop_context';
import { ORDER_STATUS } from '~/lib/constants';

import { getOrderType, OrderCollectionSpecialized } from '~/lib/types';
import { IdempotentButton } from '../buttons';
import { ReleaseButton } from '~/components/production_pages/production_injectables/release_button';


type AcceptButton = {
  collection : OrderCollectionSpecialized
} & ButtonProps;

function AcceptButton({collection, ...rest}){
  const websocket = useWebsocket();

  function acceptOrders(){
    if (!websocket){
      return Promise.resolve();
    }

    const order_type = getOrderType(collection);

    const updated_orders = []

    for(const order of collection.orders){
      if(order.status === ORDER_STATUS.ORDERED){
        order.status = ORDER_STATUS.ACCEPTED;
        updated_orders.push(order);
      }
    }

    if(updated_orders.length == 0){
      // wtf?
      return Promise.resolve();
    }

    return websocket.sendEditModels(
      updated_orders , order_type
    );
  }

  return <IdempotentButton onClick={acceptOrders} {...rest}>accepter</IdempotentButton>;
}

type ProductionOrderModalActionButton = {
  collection : OrderCollectionSpecialized
};

export function ProductionOrderModalActionButton({
  collection, authenticationState, sideEffect: releaseSideEffect, canFree=true, ...rest
}){
  switch(collection.minimum_status){
    case ORDER_STATUS.ORDERED:
      return <AcceptButton collection={collection}/>
    case ORDER_STATUS.ACCEPTED:
      return <ReleaseButton
        authenticationState={authenticationState}
        sideEffect={releaseSideEffect}
        canFree={canFree}
        {...rest}
      />
    case ORDER_STATUS.RELEASED:
      return <ReleaseCertificateButton collection={collection}/>

    default:
      return <div></div>
  }
}
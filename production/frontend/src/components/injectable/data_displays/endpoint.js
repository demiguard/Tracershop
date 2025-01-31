import React from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";


export function EndpointDisplay({endpoint}){
  const state = useTracershopState();

  // type cose to DeliveryTimeEndpoint
  if(typeof(endpoint) === 'number'){
    endpoint = state.delivery_endpoint.get(endpoint);
  }

  const owner = state.customer.get(endpoint.owner);

  if(owner.short_name === endpoint.name){
    return <div>{owner.short_name}</div>
  }

  return <div>{owner.short_name} - {endpoint.name}</div>
}
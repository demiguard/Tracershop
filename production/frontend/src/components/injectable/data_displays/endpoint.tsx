import React from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { DeliveryEndpoint } from "~/dataclasses/dataclasses";


type EndpointDisplayProps = {
  endpoint : number | DeliveryEndpoint
}

export function EndpointDisplay({endpoint} : EndpointDisplayProps){
  const state = useTracershopState();

  // type cose to DeliveryTimeEndpoint
  if(typeof(endpoint) === 'number'){
    endpoint = state.delivery_endpoint.get(endpoint);
  }

  const owner = state.customer.get(endpoint.owner);

  if(owner.short_name === endpoint.name){
    return owner.short_name
  }

  return `${owner.short_name} - ${endpoint.name}`}
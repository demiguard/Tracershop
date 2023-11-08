import React from "react";
import { useTracershopState } from "~/components/tracer_shop_context";


export function EndpointDisplay({endpoint}){
  const state = useTracershopState();

  // type cose to DeliveryTimeEndpoint
  if(endpoint instanceof Number){
    endpoint = state.delivery_endpoint.get(endpoint);
  }

  const owner = state.customer.get(endpoint.owner);

  return <div>{owner.short_name} - {endpoint.name}</div>
}
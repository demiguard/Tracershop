import React from "react";
import propTypes from 'prop-types'
import { FormControl } from "react-bootstrap";

import { Select, toOptions, Option } from "../select";
import { Customer, DeliveryEndpoint } from "~/dataclasses/dataclasses";
import { DATA_CUSTOMER, DATA_ENDPOINT } from "~/lib/shared_constants";
import { useTracershopState } from "~/components/tracer_shop_context";

/**
 * Provides a select for endpoints. 
 * @param {*} param0 
 */
export function EndpointSelect(props){
  const state = useTracershopState();

  function namingEndpoint(endpoint){
    const/**@type {Customer} */ customer = state.customer.get(endpoint.owner);

    return `${customer.short_name} - ${endpoint.name}`;
  }

  let /**@type {}  */ endpointOptions = []  // this is a turnary but readability
  if (props[DATA_ENDPOINT] instanceof Map){
    endpointOptions = toOptions(props[DATA_ENDPOINT].values(), namingEndpoint, "id")
  } else if (props[DATA_ENDPOINT] instanceof Array) {
    endpointOptions = toOptions(props[DATA_ENDPOINT], namingEndpoint, "id");
  }

  if(props.emptyEndpoint){ // doesn't need to be defined
    endpointOptions.push(new Option("", "------------"))
  }

  const newProps = {...props};
  delete newProps[DATA_ENDPOINT];
  delete newProps[DATA_CUSTOMER];
  delete newProps.emptyEndpoint;
  newProps['options'] = endpointOptions

  return <Select {...newProps}/>
}

EndpointSelect.propTypes = {
  emptyEndpoint : propTypes.bool,
  [DATA_ENDPOINT] : propTypes.oneOf([propTypes.instanceOf(Map),
                      propTypes.arrayOf(propTypes.instanceOf(DeliveryEndpoint))]),
}

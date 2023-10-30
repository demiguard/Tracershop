import React from "react";
import propTypes from 'prop-types'
import { FormControl } from "react-bootstrap";

import { Select, toOptions, Option } from "../select";
import { Customer, DeliveryEndpoint } from "~/dataclasses/dataclasses";
import { DATA_CUSTOMER, DATA_ENDPOINT } from "~/lib/shared_constants";

/**
 * Provides a select for endpoints. 
 * @param {*} param0 
 */
export function EndpointSelect(props){
  function namingEndpoint(endpoint){
    if (props[DATA_CUSTOMER] instanceof Map){
      const/**@type {Customer} */ customer = props[DATA_CUSTOMER].get(endpoint.owner);
      return `${customer.short_name} - ${endpoint.name}`;
    }
    return  endpoint.name

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
  [DATA_CUSTOMER] : propTypes.objectOf(Map),
  [DATA_ENDPOINT] : propTypes.oneOfType([propTypes.objectOf(Map), propTypes.array]),
}

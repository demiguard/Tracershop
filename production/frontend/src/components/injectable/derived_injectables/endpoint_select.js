import React from "react";
import { Select, toOptions, Option } from "../select";
import { FormControl } from "react-bootstrap";
import { Customer, DeliveryEndpoint } from "../../../dataclasses/dataclasses";
import { JSON_CUSTOMER, JSON_ENDPOINT } from "../../../lib/constants";

/**
 * Provides a select for endpoints. 
 * @param {*} param0 
 */
export function EndpointSelect(props){
  function namingEndpoint(endpoint){
    if (props[JSON_CUSTOMER] instanceof Map){
      const/**@type {Customer} */ customer = props[JSON_CUSTOMER].get(endpoint.owner);
      return `${customer.short_name} - ${endpoint.name}`;
    }
    return  endpoint.name

  }



  let /**@type {}  */ endpointOptions = []  // this is a turnary but readability
  if (props[JSON_ENDPOINT] instanceof Map){
    endpointOptions = toOptions(props[JSON_ENDPOINT].values(), namingEndpoint, "id")
  } else if (props[JSON_ENDPOINT] instanceof Array) {
    endpointOptions = toOptions(props[JSON_ENDPOINT], namingEndpoint, "id");
  }

  if(props.emptyEndpoint){ // doesn't need to be defined
    endpointOptions.push(new Option("", "------------"))
  }

  const newProps = {...props};
  delete newProps[JSON_ENDPOINT];
  delete newProps[JSON_CUSTOMER];
  delete newProps.emptyEndpoint;
  newProps['options'] = endpointOptions

  if(endpointOptions.length === 0){
    <FormControl {...newProps} readOnly/>
  }
  if(endpointOptions.length === 1){
    return <FormControl {...newProps} readOnly value={endpointOptions[0].name}/>
  }

  return <Select {...newProps}/>
}

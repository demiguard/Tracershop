import React from "react";
import { Select } from "../select";
import { FormControl } from "react-bootstrap";
import { Customer, DeliveryEndpoint } from "../../../dataclasses/dataclasses";
import { JSON_CUSTOMER, JSON_ENDPOINT } from "../../../lib/constants";

/**
 * Provides a select for endpoints. 
 * @param {*} param0 
 */
export function EndpointSelect(props){
  function toOption(endpoint){
    if (props[JSON_CUSTOMER] instanceof Map){
      const/**@type {Customer} */ customer = props[JSON_CUSTOMER].get(endpoint.owner)
      return {
        id : endpoint.id,
        name : `${customer.short_name} - ${endpoint.name}`,
      }
    }

    return {
      id : endpoint.id,
      name : endpoint.name,
    }
  }

  let /**@type {}  */ endpointOptions = []  // this is a turnary but readability
  if (props[JSON_ENDPOINT] instanceof Map){
    endpointOptions =  [...props[JSON_ENDPOINT].values()].map(toOption);
  } else if (props[JSON_ENDPOINT] instanceof Array) {
    endpointOptions = props[JSON_ENDPOINT].map(toOption);
  }

  if(props.emptyEndpoint){ // doesn't need to be defined
    endpointOptions.push({
      id : "",
      name :"------------"
    })
  }

  const newProps = {...props};
  delete newProps[JSON_ENDPOINT];
  delete newProps.emptyEndpoint;
  delete newProps[JSON_CUSTOMER];

  if(endpointOptions.length === 0){
    <FormControl {...newProps} readOnly/>
  }
  if(endpointOptions.length === 1){
    return <FormControl {...newProps} readOnly value={endpointOptions[0].name}/>
  }

  return <Select
    options={endpointOptions}
    nameKey="name"
    valueKey="id"
    {...newProps}
  />
}

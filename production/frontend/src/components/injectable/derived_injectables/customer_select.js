import React from "react";
import { JSON_CUSTOMER } from "../../../lib/constants";
import { Select } from "../select";
import { FormControl } from "react-bootstrap";

/**
 * 
 * @param {*} param0 
 */
export function CustomerSelect(props){

  /**
   * Maps the customer to an option container accepted by the Select Component
   * @param {Customer} customer - customer to be transformed
   * @returns {{ id : Number, name : String}}
   */
  function toOption(customer){
    return {
      id : customer.id,
      name : customer.short_name,
    }
  }

  let /**@type {Array<Object>}  */ customerOptions = []  // this is a turnary but, i think this easier to read
  if (props.customer instanceof Map){
    customerOptions =  [...props.customer.values()].map(toOption);
  } else if (props.customer instanceof Array) {
    customerOptions = props.customer.map(toOption);
  }

  if(props.emptyCustomer){ // doesn't need to be defined
    customerOptions.push({
      id : "",
      name :"------------"
    })
  }

  const newProps = {...props};
  delete newProps.customer;
  delete newProps.emptyCustomer;

  if(customerOptions.length === 0){
    <FormControl readOnly/>
  }
  if(customerOptions.length === 1){
    return <FormControl readOnly value={customerOptions[0].name}/>
  }

  return <Select
    options={customerOptions}
    nameKey="name"
    valueKey="id"
    {...newProps}
  />



}
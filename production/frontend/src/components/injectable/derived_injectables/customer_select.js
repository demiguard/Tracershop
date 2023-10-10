import React from "react";
import { DATA_CUSTOMER } from "../../../lib/constants";
import { Select, toOptions, Option } from "../select";
import { FormControl } from "react-bootstrap";
import PropTypes from 'prop-types'
import { Customer } from "../../../dataclasses/dataclasses";

const propTypes = PropTypes // WELL I COULDN*T RENAME IN THE IMPORT

/**
 * 
 * @param {*} param0 
 */
export function CustomerSelect(props){
  let /**@type {Array<Customer>}  */ customerOptions = []  // this is a turnary but, i think this easier to read
  if (props.customers instanceof Map){
    customerOptions = toOptions(props.customers, 'short_name', 'id')
  } else if (props.customers instanceof Array) {
    customerOptions = toOptions(props.customers, 'short_name', 'id');
  }

  if(props.emptyCustomer){ // doesn't need to be defined
    customerOptions.push(new Option("","------------"))
  }

  const newProps = {...props};
  delete newProps.customers;
  delete newProps.emptyCustomer;
  newProps.options = customerOptions

  if(customerOptions.length === 0){
    return <FormControl {...newProps} readOnly/>
  }
  if(customerOptions.length === 1){
    return <FormControl {...newProps} readOnly value={customerOptions[0].name}/>
  }

  return <Select
    {...newProps}
  />
}

CustomerSelect.propTypes = {
  customers : PropTypes.oneOfType([PropTypes.arrayOf(Customer), PropTypes.instanceOf(Map)]).isRequired,
  customerEmpty : PropTypes.oneOf([undefined, propTypes.bool])
}
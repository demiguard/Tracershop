import React from "react";
import { InputGroup } from "react-bootstrap";

export function TracershopInputGroup(props) {
  const children = props.children
  const label = props.label

  const newProps = {...props};
  /* istanbul ignore next */
  if(props.value === null || props.value === undefined){
    /* istanbul ignore next */
    newProps.value = ""
  }

  delete newProps.children
  delete newProps.label

  return (
  <InputGroup

  style={{
    marginTop : '5px',
    marginBottom : '5px',
  }}
  {...newProps}
  >
    <InputGroup.Text>{label}</InputGroup.Text>
    {children}
  </InputGroup>)

}
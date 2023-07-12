import React from "react";
import { InputGroup } from "react-bootstrap";

export function TracershopInputGroup(props) {
  const children = props.children
  const label = props.label

  const newProps = {...props};

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
import React from "react";
import { InputGroup } from "react-bootstrap";

export function TracershopInputGroup({children, label}) {
  return (
  <InputGroup
    style={{
      marginTop : '5px',
      marginBottom : '5px',
    }}
  >
    <InputGroup.Text>{label}</InputGroup.Text>
    {children}
  </InputGroup>)

}
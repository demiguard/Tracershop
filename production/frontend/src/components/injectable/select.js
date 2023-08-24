import React from "react";
import { Form } from "react-bootstrap";

export function Select(props) {
  const Options = props.options.map(
    (option) => <option value={option[props.valueKey]} key={option[props.valueKey]}>
                  {option[props.nameKey]}
                </option>);
  const newProps = {...props}

  delete newProps['options']
  delete newProps['valueKey']
  delete newProps['nameKey']

  return (<Form.Select{...newProps}> {Options}</Form.Select>)
}
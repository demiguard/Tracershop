/**This module is for various time inputs */
import React from "react"
import { FormControl } from "react-bootstrap"

/**
 * Attempt 3 making this
 * @param {Event} event 
 * @param {String} currentInput 
 * @returns {String}
 */
function addTimeColons(event, currentInput){
  const input = event.target.value;
  const lastChar = input.charAt(input.length - 1);

  if(input.length > currentInput.length
    && [3,6].includes(input.length)
    && lastChar !== ":" ){
        return currentInput + ":" + lastChar;
  }
  return input;
}

/**
 * 
 * @param {{
 * stateFunction : CallableFunction - function used for setting an input
 * }} props
 * @returns 
 */
export function TimeInput(props){
  const newProps = {...props};

  function inputFunction(event){
    props.stateFunction(addTimeColons(event, props.value));
  }

  delete newProps.stateFunction;
  newProps['onChange'] = inputFunction;

  if('canEdit' in props){
    if(!props['canEdit']){
      newProps['readOnly'] = true;
      delete newProps['onChange'];

    }
    delete newProps['canEdit'];
  }

  return <FormControl
    {...newProps}
    onChange={inputFunction}
  />
}
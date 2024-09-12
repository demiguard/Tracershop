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
  const {stateFunction, canEdit=true,  ...rest} = props;

  function inputFunction(event){
    stateFunction(addTimeColons(event, props.value));
  }

  rest['onChange'] = inputFunction;

  if(!canEdit){
    rest['readOnly'] = true;
    delete rest['onChange'];
  }

  return <FormControl
    {...rest}
  />
}
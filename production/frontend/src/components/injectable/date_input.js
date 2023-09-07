/**This module is for various time inputs */
import React from "react"
import { FormControl } from "react-bootstrap"

/**
 * Attempt 3 making this
 * @param {Event} event 
 * @param {String} currentInput 
 * @returns {String}
 */



function addDateSlashes(event, currentInput){
  const input = event.target.value;
  const lastChar = input.charAt(input.length - 1);

  if(input.length > currentInput.length
    && [3,6].includes(input.length
    && lastChar !== "/")){
      return currentInput + "/" + lastChar;
  }
  return input;
}

/**
 * Input that automaticly addes a slash after 2 and 5 character
 * allowing the user to type 11052022 and get the input 11/05/2022
 * @param {{
 *   stateFunction : CallableFunction - function used for setting an input
 * }} props
 * @returns {Element}
 */
export function DateInput(props){
  const formControlProps = {...props};

  function inputFunction(event){
    props.stateFunction(addDateSlashes(event, props.value));
  }

  delete formControlProps.stateFunction;

  return <FormControl
    {...formControlProps}
    onChange={inputFunction}
  />
}
/**This module is for various time inputs */
import React from "react"
import { FormControl } from "react-bootstrap"
import { ReactState } from "~/lib/types";

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

type TimeInputProps = {
  stateFunction : React.Dispatch<React.SetStateAction<string>>
  canEdit?: boolean
  value : string
}

export function TimeInput({stateFunction, canEdit=true, value, ...rest}: TimeInputProps){
  function inputFunction(event){
    stateFunction(addTimeColons(event, value));
  }

  rest['onChange'] = inputFunction;

  if(!canEdit){
    rest['readOnly'] = true;
    delete rest['onChange'];
  }

  return <FormControl
    value={value}
    {...rest}
  />
}
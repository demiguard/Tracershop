/**This module is parsing user input, this is to find errors  in their input.
 * errors as values are amazing
 */

import { FormatTime, ParseDanishNumber, batchNumberValidator } from "./formatting"

/**
 * Parses a string, which should contain a danish number. If it doesn't, returns false, 
 * and a description why it's faulty.
 * @param {string} input 
 * @returns
 */
export function parseDanishNumberInput (input, header="") {
  const inputNumber = ParseDanishNumber(input)

  if(input === ""){ // Because Number("") == 0 for some javascript reason...
    return [false, `${header} er ikke tasted ind`];
  }

  if(isNaN(inputNumber)){
    return [false, `${header} er ikke et tal`];
  }

  return [true, inputNumber];
}


export function parseDanishPositiveNumberInput(input, header=""){
  const [valid, inputNumber] = parseDanishNumberInput(input);

  if(!valid){
    return [valid, inputNumber];
  }

  if(inputNumber <= 0){
    return [false, `${header} kan ikke være negativ`];
  }

  return [true, inputNumber]
}

export function parseTimeInput(input, header=""){
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }

  const time = FormatTime(input)
  if(time === null){
    return [false, `${header} er ikke formattet som et tidspunkt`]
  }

  return [true, time]
}

export function parseBatchNumberInput(input, header=""){
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }

  if (!batchNumberValidator(input)){
    return [false, `${header} er ikke formateret korrekt`];
  }

  return [true, input]
}

/**
 * 
 * @param {Array<String>} errorList - Container for the error messages
 * @param {Boolean} valid true if error
 * @param {String | any} errorMessage string if error otherwise any
 * @returns 
 */
export function concatErrors(errorList, valid, errorMessage){
  if(!valid) {
    errorList.push(errorMessage)
  }
  return valid
}

/**
 * Attempt 3 making this
 * @param {Event} event 
 * @param {String} currentInput 
 * @returns {String}
 */
export function addTimeColons(event, currentInput){
  if(event.target.value.length > currentInput.length
    && [2,5].includes(event.target.value.length)){
      return event.target.value + ":"
  }
  return event.target.value;
}
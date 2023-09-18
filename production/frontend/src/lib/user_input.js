/**This module is parsing user input, this is to find errors in their input
 * and type conversion of the value.
 * Errors as values are amazing
 * Also this could be turned into some monads, if I was feeling particular fancy
 */

import { FormatTime, ParseDanishNumber, batchNumberValidator, parseDate } from "./formatting"


/**
 * Parses a string, which should contain a danish number. If it doesn't, returns false, 
 * and a description why it's faulty.
 * @param {string} input 
 * @returns
 */
export function parseDanishNumberInput (input, header="") {
  const inputNumber = ParseDanishNumber(input);

  if(input === ""){ // Because Number("") == 0 for some javascript reason...
    return [false, `${header} er ikke tasted ind`];
  }

  if(isNaN(inputNumber)){
    return [false, `${header} er ikke et tal`];
  }

  return [true, inputNumber];
}


export function parseDanishPositiveNumberInput(input, header=""){
  const [valid, inputNumber] = parseDanishNumberInput(input, header);

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

export function parseIPInput(input, header=""){
  const valid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
  if(!valid){
    return [false, `${header} er ikke formatteret som en IP addresse`];
  }
  return [true, input];
}

/** Checks if a string is a valid port number
 *
 *
 * @param {string} input - User input from field
 * @returns {Object} - Object with attribute valid : bool and value : int
 */
export function parsePortInput(input, header=""){
  const numberPort = Number(input);
  if(isNaN(numberPort) || !/^\d+$/.test(input)){
    return [false, `${header} er ikke et helt positivt tal.`]
  }
  if(numberPort <= 0){
    return [false, `${header} skal være postivt tal mindre end 49151.`]
  }

  if(65535 < numberPort){
    return [false, `${header} skal være en normal port (<49151).`]
  }

  if(49151 < numberPort){
    return [false, `${header} må ikke være en dynamisk port.`]
  }

  return [true, numberPort]
}

export function parseAETitleInput(input, header=""){
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }
  if(16 < input.length){
    return [false, `${header} kan ikke være længere end 16 karaktere.`];
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
 *
 * @param {*} input 
 * @param {*} header 
 * @returns 
 */
export function parseDateInput(input, header=""){
  const dateString = parseDate(input);
  if (dateString === null){
    return [false, `${header} er ikke på dato format`]
  }

  const date = new Date(dateString);
  if(isNaN(date)){
    return [false, `${header} er ikke en valid dato`]
  }
  return [true, date];
}
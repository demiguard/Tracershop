/**This module is parsing user input, this is to find errors in their input
 * and type conversion of the value.
 * Errors as values are amazing
 * Also this could be turned into some monads, if I was feeling particular fancy
 */

import { FormatTime, ParseDanishNumber, batchNumberValidator, nullParser, parseDate } from "./formatting"

type ValidNumber = [true, number] | [false, string]

/**
 * Parses a string, which should contain a danish number. If it doesn't, returns
 * false, and a description why it's faulty.
 */
export function parseDanishNumberInput (input: string , header="") : ValidNumber {
  const inputNumber = ParseDanishNumber(input);

  if(input === ""){ // Because Number("") == 0 for some javascript reason...
    return [false, `${header} er ikke tasted ind`];
  }

  if(isNaN(inputNumber)){
    return [false, `${header} er ikke et tal`];
  }

  return [true, inputNumber];
}


export function parseDanishPositiveNumberInput(input: string, header="") : ValidNumber {
  const [valid, inputNumber] = parseDanishNumberInput(input, header);

  if(!valid){
    // Type checker isn't smart enough to figure out that this a string
    return [false , inputNumber as string ];
  }

  // But can here ????
  if(inputNumber === 0){
    return  [false, `${header} kan ikke være nul`]
  }

  if(inputNumber < 0){
    return [false, `${header} kan ikke være negativ`];
  }

  return [true, inputNumber]
}

export function parseDanish0OrPositiveNumberInput(input: string, header="") : ValidNumber{
  const [valid, inputNumber] = parseDanishNumberInput(input, header);

  if(!valid){
    return [false, inputNumber as string];
  }

  if(inputNumber < 0){
    return [false, `${header} kan ikke være negativ`];
  }

  return [true, inputNumber];
}



export function parseWholePositiveNumber(input: string, header="") : ValidNumber {
  const [valid, number] = parseDanishPositiveNumberInput(input, header);
  if(!valid){
    return [false, number as string];
  }

  if (number !== Math.floor(number)){
    return [false, `${header} er ikke et helt tal`];
  }

  return [true, number]
}


export function parseTimeInput(input : string, header="") : [boolean, string]{
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }

  const time = FormatTime(input)
  if(time === null){
    return [false, `${header} er ikke formattet som et tidspunkt`]
  }

  return [true, time]
}

export function parseBatchNumberInput(input: string, header="") : [boolean, string] {
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }

  if (!batchNumberValidator(input)){
    return [false, `${header} er ikke formateret korrekt`];
  }

  return [true, input]
}

export function parseIPInput(input: string, header=""): [boolean, string]{
  const valid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
  if(!valid){
    return [false, `${header} er ikke formatteret som en IP addresse`];
  }
  return [true, input];
}

/** Checks if a string is a valid port number
 */
export function parsePortInput(input: string, header=""): ValidNumber{
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

export function parseStringInput(input: string, header="", max_length=80, allow_empty=true) : [boolean, string]{
  input = nullParser(input);
  input = input.trim();
  if(input === "" && !allow_empty){
    return [false, `${header} er ikke tasted ind`];
  }

  if(max_length < input.length){
    return [false, `${header} kan ikke være længere end ${max_length} karaktere.`];
  }

  return [true, input];
}

export function parseAETitleInput(input: string, header=""): [boolean, string]{
  if(input === ""){
    return [false, `${header} er ikke tasted ind`];
  }
  if(16 < input.length){
    return [false, `${header} kan ikke være længere end 16 karaktere.`];
  }

  return [true, input]
}

export function concatErrors(errorList: Array<string>, valid: boolean, errorMessage: string){
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
export function parseDateInput(input: string, header=""): [true, Date] | [false, string]{
  const dateString = parseDate(input);
  if (dateString === null){
    return [false, `${header} er ikke på dato format`]
  }

  const date = new Date(dateString);
  if(isNaN(date.valueOf())){
    return [false, `${header} er ikke en valid dato`]
  }
  return [true, date];
}
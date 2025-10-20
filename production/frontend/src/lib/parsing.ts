/** This module contains function that is intend to be used with ErrorMonad:
 *
 * Example:
 *
 * const monad = new ErrorMonad();
 * monad.apply(parse$<stuff>(input, header));
 * monad.apply(parse$<stuff>(input, header));
 * monad.apply(parse$<stuff>(input, header));
 * monad.apply(parse$<stuff>(input, header));
 *
 * if(monad.hasError){
 *   setError()
 * }
 *
 */

import { ErrorFunction } from "./types";
import { batchNumberValidator, FormatTime, ParseDanishNumber } from "./formatting";

function emptyError(header){
  return {
    valid : false,
    error : `${header} er ikke tastet ind`,
    id : header
  }
}

export function parseDanishNumberBind(input: string, header: string) : ErrorFunction {
  return () => {
    const inputNumber = ParseDanishNumber(input);

    if(input === ""){ // Because Number("") == 0 for some javascript reason...
      return emptyError(header);
    }

    if(isNaN(inputNumber)){
      return {
        valid : false,
        error : `${header} er ikke et tal`,
        id : header
      }
    }

    return {
      id : header,
      valid : true,
      value : inputNumber
    }
  }
}

export function parseDanish0OrPositiveNumberBind(input: string, header : string) : ErrorFunction {
  return () => {
    const danishNumber = parseDanishNumberBind(input, header)();

    if(!danishNumber.valid){
      return danishNumber;
    }

    if(danishNumber.value < 0){
      return {
        id : header,
        valid : false,
        error : `${header} kan ikke være negativ`,
      }
    }

    return danishNumber;
  }
}


export function parseDanishPositiveNumberBind(input : string, header : string) : ErrorFunction {
  return () => {
    const danishNumber = parseDanish0OrPositiveNumberBind(input, header)();

    if(!danishNumber.valid){
      return danishNumber;
    }

    if(danishNumber.value < 0){
      return {
        id : header,
        valid : false,
        error : `${header} kan ikke være negativ`,
      }
    }
    return danishNumber;
  }
}

export function parseWholePositiveNumberBind(input: string, header : string) : ErrorFunction {
  return () => {
    const danishNumber = parseDanishPositiveNumberBind(input, header)();

    if(!danishNumber.valid){
      return danishNumber;
    }

    if (danishNumber.value !== Math.floor(danishNumber.value)){
      return {
        valid : false,
        error : `${header} er ikke et helt tal`,
        id : header,
      };
    }
    return danishNumber
  }
}

export function parseTimeBind(input : string, header: string) : ErrorFunction {
  return () => {
    if(input === ""){
      return emptyError(header);
    }

    const time = FormatTime(input);

    if(time === null){
      return {
        valid : false,
        error : `${header} er ikke formattet som et tidspunkt`,
        id : header
      };
    }

    return {
      id : header,
      valid : true,
      value : time,
    }
  }
}

export function parseBatchNumberBind(input: string, header: string) : ErrorFunction {
  return () => {
    if(input === ""){
      return emptyError(header);
    }
    if (!batchNumberValidator(input)){
      return {
        valid : false,
        error : `${header} er ikke formateret korrekt`,
        id : header
      };
    }

    return {
      id : header,
      value : input,
      valid : true
    }
  }
}

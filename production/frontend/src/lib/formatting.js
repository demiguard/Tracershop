/** This modules handles most conversion of user input into valid data
 *
 */

import { MODELS, User } from "~/dataclasses/dataclasses";

/** Checks if the input string is on a date format, if it is, converts to a standardized format of
 * YYYY-MM-DD
 *
 * Valid Formats are:
 * * YYYY-MM-DD
 * * YYYY/MM/DD
 * * DD/MM/YYYY
 * * DD-MM-YYYY
 *
 * Throws an error if not on format, I.E DON'T USE THIS FUNCTION FOR unchecked data
 *
 * @throws "Date not on known format, Date: "+inputStr if on format
 * @param {string} inputStr - a String on the valid format
 * @returns {string}
 */
export function parseDate(inputStr){
  inputStr = inputStr.trim();

  if (/\d{4}-\d{2}-\d{2}/g.test(inputStr)) {
    return inputStr;
  }

  if (/\d{4}\/\d{2}\/\d{2}/g.test(inputStr)) {
    return inputStr.substring(0,4)+ "-" + inputStr.substring(5,7) + "-" + inputStr.substring(8,10);
  }

  if (/\d{2}\/\d{2}\/\d{4}/g.test(inputStr)) {
    return inputStr.substring(6,10) + "-" + inputStr.substring(3,5) + "-" + inputStr.substring(0,2);
  }

  if (/\d{2}-\d{2}-\d{4}/g.test(inputStr)) {
    return inputStr.substring(6,10) + "-" + inputStr.substring(3,5) + "-" + inputStr.substring(0,2);
  }

  //Todo add more formats
  return null;
}

/**
 * Formats a string written with a "," to indicate decimals.
 * Accepts english variations as well.
 *
 * @idempotent
 * @param {String | Number} numberString - The string to be formatted
 * @returns {Number} - The number the string represent
 */
export function ParseDanishNumber(numberString){
  if (typeof numberString == "string") {
    const parsedNumber = numberString.replace(/,/g, ".");
    return Number(parsedNumber);
  } else {
    return numberString;
  }
}


export function parseDateToDanishDate(dateString){
  /* This function takes a date string on the format YYYY-MM-DD and formats it to DD-MM-YYYY
   * The Primary function should be to convert input dates to display dates.
   * This Date format is the one used by the site and throws an Error if it's not sites format
   * This is kinda a warning to don't use this function for user input parsing
   */
  if (!/^\d{4}-\d{2}-\d{2}$/g.test(dateString)) throw "Date not on format, Input: " + dateString;

  return `${dateString.substr(8,2)}/${dateString.substr(5,2)}/${dateString.substr(0,4)}`;
}

/**
 * Checks if a string is on a valid time format:
 *
 * - HH:MM:SS
 * - (0)H:MM:SS
 * - HH:MM   -> HH:MM:00
 * - (0)H:MM -> 0H:MM:00
 * - HH.MM.SS  -> HH:MM:00
 * - (0)H.MM.SS -> 0H:MM:00
 * - HH.MM   -> HH:MM:00
 * - (0)H.MM -> 0H:MM:00
 * Number in paraentens are missing from the text and are assumed to be there.
 * If the string is not on the format returns null.
 * @idempotent
 * @param {string} timeStr
 * @returns {string} time string on format HH:MM:SS
*/
export function FormatTime (timeStr) {

  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/g.test(timeStr)) return timeStr;
  if (/^[0-9]:[0-5][0-9]:[0-5][0-9]$/g.test(timeStr)) return "0" + timeStr;
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/g.test(timeStr)) return timeStr + ":00";
  if (/^[0-9]:[0-5][0-9]$/g.test(timeStr)) return "0" + timeStr + ":00";
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:$/g.test(timeStr)) return timeStr + "00";
  if (/^[0-9]:[0-5][0-9]:$/g.test(timeStr)) return "0" + timeStr + "00";

  return null;
}

export function FormatDateStr(number) {
  return number < 10 ? "0" + String(number) : String(number)
}

/**
 * Converts a string to it related json encoded object
 * This function is idempotent
 * @param {String | Object} JSONString
 * @returns {object} JSON formatted object
 */
export function ParseJSONstr(JSONString){
  let json = JSONString;
  while (typeof(json) == "string"){
    json = JSON.parse(json);
  }
  return json;
}

export function ParseDjangoModelJson(JSONString, originalMap, modelType){
  const json = ParseJSONstr(JSONString);
  const updatedMap =  (originalMap instanceof Map ) ?  new Map(originalMap) : new Map();
  // Use that it's a list of objects with information in the following form
  //{ model : string of model name on format module.model for instance api.database
  //  pk    : Something that is the primary key of the model instance
  //  fields : Object with table names
  //}
  for (const model of json){
    model.fields.id = model.pk
    const Model = MODELS[modelType];
    const serializedObject = new Model();
    Object.assign(serializedObject, model.fields);
    updatedMap.set(serializedObject.id, serializedObject);
  }
  return updatedMap;
}

export function ParseEmail(input){
  if(input.length == 0) return true;
  return /^[a-zA-Z0-9.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(input);
}

export function isNotNaN(number){
  return !isNaN(number);
}

/**
 *
 * @param {String} input - String to be checked
 * @param {Number} min_length - whole number indicating minimum length of string
 * @param {Number} max_length - Maximum length of string to parse check
 * @returns {Object}
 */
export function StringValidator(input, min_length, max_length){
  const valid = min_length < input.length && input.length < max_length;
  const value = (valid) ? input : null;
  return {
    valid : valid,
    value : value,
  };
}

/**
 * Determines if a string is a batch / lot number
 * @param {String} str A potential Batch number
 * @returns {boolean} - true if str is a batch number false if not
 */
export function batchNumberValidator(str){
  return /[a-zA-Z]+-\d{6}-[1-9]\d*/g.test(str);
}

/**
 * Converts a date object to a string describing the date
 * date(2000,4,3) -> 2000-05-03
 * @param {Date} date - date to be converted
 * @returns {string}
 */
export function dateToDateString(date){
  return `${date.getFullYear()}-${FormatDateStr(date.getMonth() + 1)}-${FormatDateStr(date.getDate())}`
}

/**
 *
 * @param {Date | Number} day - date or number from 0-6
 * @returns {String} the name of the day
 */
export function getDateName(day){
  if (day instanceof Date){
    day = (day.getDay() + 6) % 7;
  }
  if (day == 0){
    return "Mandag"
  }
  if (day == 1){
    return "Tirsdag"
  }
  if (day == 2){
    return "Onsdag"
  }
  if (day == 3){
    return "Torsdag"
  }
  if (day == 4){
    return "Fredag"
  }
  if (day == 5){
    return "Lørdag"
  }
  if (day == 6){
    return "Søndag"
  }

  throw "Unknown Day"
}

/**
 * This function is exists because react doesn't like null,
 * So now I have to deal with the abstraction that the absense of a value is ""
 * Rather than null.
 * @param {Any} value - Any value to be checked if it's null
 * @returns {Any} - EXCEPT NULL of cause
 */
export function nullParser(value){
  return (value === null) ? "" : value;
}

export function makePassword(len){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < len) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

/**
 *
 * @param {String} str
 * @returns {String}
 */
export function Capitalize(str){
  return str[0].toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
}

/** Parses a date object into a danish formatted string
 *
 * @param {String} dateString - The String to be converted into a date object to be converted and back again
 * @returns {String} - the formatted string
 */
export function renderDateTime(dateString){
  const dateObject = new Date(dateString);
  const hours    = FormatDateStr(dateObject.getHours());
  const minutes  = FormatDateStr(dateObject.getMinutes());
  const day      = FormatDateStr(dateObject.getDate());
  const month    = FormatDateStr(dateObject.getMonth() + 1);
  const year     = String(dateObject.getFullYear());

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 *
 * @param {User | null} user
 * @returns
 */
export function formatUsername(user){
  if(user === null){
    return "";
  }

  return user.username.toUpperCase();
}

/**
 *
 * @param {String | Date | null} date
 * @returns
 */
export function formatTimeStamp(date){
  if (date === null) {
    return "Ukendt";
  }

  if(!(date instanceof Date)){
    const newDate = new Date(date); // I was tired when i wrote this
    return newDate.toLocaleTimeString([], {hour12 : false,
                                           hour : "2-digit",
                                           minute : "2-digit"
                                     });
  }

  return date.toLocaleTimeString([], {hour12 : false,
                                      hour : "2-digit",
                                      minute : "2-digit"
  })
}

export function escapeInputString(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 *
 * @param {String} accessionNumber - string on the form DKREGHXXXXXXXX
 * @returns
 */
export function formatAccessionNumber(accessionNumber){
  const regex = /([a-zA-Z]+)(\d+)(\d{4})/;
  const match = accessionNumber.match(regex);

  if(match.length < 4){
    return accessionNumber
  }

  return `${match[1]}${'X'.repeat(match[2].length)}${match[3]}`;
}
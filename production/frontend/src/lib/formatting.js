/** This modules handles most conversion of user input into valid data
 *
 */

/** Checks 
 *
 * @param {string} inputStr 
 * @returns {string}
 */
export function parseDate(inputStr){
  if (/^\d{4}-\d{2}-\d{2}$/g.test(inputStr)) return inputStr;
  if (/^\d{4}\/\d{2}\/\d{2}$/g.test(inputStr)) return inputStr.substring(0,4)+ "-" + inputStr.substring(5,7) + "-" + inputStr.substring(8,10);
  if (/^\d{2}\/\d{2}\/\d{4}$/g.test(inputStr)) return inputStr.substring(6,10) + "-" + inputStr.substring(3,5) + "-" + inputStr.substring(0,2);
  if (/^\d{2}-\d{2}-\d{4}$/g.test(inputStr)) return inputStr.substring(6,10) + "-" + inputStr.substring(3,5) + "-" + inputStr.substring(0,2);
  //Todo add more formats
  throw "Date not on known format, Date: "+inputStr
}

export function ParseDanishNumber(numberString){
  if (typeof numberString == "string") {
    const parsedNumber = numberString.replace(/,/g, ".");
    return Number(parsedNumber);
  } else {
    return numberString
  }
}


export function parseDateToDanishDate(dateString){
  /* This funciton takes a date string on the format YYYY-MM-DD and formats it to DD-MM-YYYY
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
 *
  * @param {string} timeStr
  * @returns {string} time string on format HH:MM:SS
*/
export function FormatTime (timeStr) {

  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/g.test(timeStr)) return timeStr;
  if (/^[0-9]:[0-5][0-9]:[0-5][0-9]$/g.test(timeStr)) return "0" + timeStr;
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/g.test(timeStr)) return timeStr + ":00";
  if (/^[0-9]:[0-5][0-9]$/g.test(timeStr)) return "0" + timeStr + ":00";

  return null;
}

export function FormatDateStr(number) {
  return number < 10 ? "0" + String(number) : String(number)
}

/**
 * @param {String} JSONString
 * @returns {object} Jsonformatted object
 */
export function ParseJSONstr(JSONString){
  var json = JSONString;
  while (typeof(json) == "string"){
    json = JSON.parse(json);
  }
  return json;
}

export function ParseDjangoModelJson(JSONString){
  var json = ParseJSONstr(JSONString);
  const ModelMap = new Map();
  // Use that it's a list of objects with information in the following form
  //{ model : string of model name on format module.model for instance api.database
  //  pk    : Something that is the primary key of the model instance
  //  fields : Object with table names
  //}
  for (const model of json){
    ModelMap.set(model.pk, model.fields)
  }
  return ModelMap;
}

export function ParseEmail(input){
  if(input.length == 0) return true;
  return /^[a-zA-Z0-9.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(input);
}

export function isNotNaN(number){
  return !isNaN(number);
}
/** Checks if a string is a valid port number
 * If string is not valid then value is nulls
 *
 * @param {string} input - User input from field
 * @returns {Object} - Object with attribute valid : bool and value : int
 */
export function PortValidator(input){
  const num = Number(input);
  const valid = /^[0-9]+$/.test(input) && num <= 49151 && num > 0; // Yeah I'm lazy to write the full regex
  const value = (valid) ? num : null;
  return {
    valid : valid,
    value : value
  }
}

export function IPValidator(input){
  const valid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
  const value = (valid) ? input : null;
  return {
    valid : valid,
    value : value,
  };
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
export function parseDate(inputStr){
  if (/^\d{4}-\d{2}-\d{2}$/g.test(inputStr)) return inputStr;
  if (/^\d{4}\/\d{2}\/\d{2}$/g.test(inputStr)) return inputStr.substr(0,4)+ "-" + inputStr.substr(5,2) + "-" + inputStr.substr(8,2);
  if (/^\d{2}\/\d{2}\/\d{4}$/g.test(inputStr)) return inputStr.substr(6,4) + "-" + inputStr.substr(3,2) + "-" + inputStr.substr(0,2);
  if (/^\d{2}-\d{2}-\d{4}$/g.test(inputStr)) return inputStr.substr(6,4) + "-" + inputStr.substr(3,2) + "-" + inputStr.substr(0,2);
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

export function FormatNumber(NumberString) {
  if (/^\d+$/.test(NumberString)) return NumberString;
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
  var json = JSONString;
  while (typeof(json) == "string"){
    json = JSON.parse(json);
  }
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

export function ParseTelefonNumber(input){
  return /^(\+45)?( )?(\d{8}|\d{2} \d{2} \d{2} \d{2}|\d{4} \d{4})$/.test(input);
}

export function parseName(input){
  return input.length > 0;
}

export function isNotNaN(number){
  return !isNaN(number);
}

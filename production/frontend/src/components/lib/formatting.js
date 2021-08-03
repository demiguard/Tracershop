export { FormatTime, FormatNumber, FormatDateStr }

function FormatTime (timeStr) {
  /**
   * Number in paraentens are missing from the text and are assumed to be there
   * Checks if a string is on a valid time format:
   * 
   * HH:MM:SS
   * (0)H:MM:SS 
   * HH:MM   -> HH:MM:00
   * (0)H:MM -> 0H:MM:00
   * HH.MM.SS  -> HH:MM:00
   * (0)HMM.SS -> 0H:MM:00
   * HH.MM   -> HH:MM:00
   * (0)H.MM -> 0H:MM:00
   * 
   * If the string is not on the format returns null
   */

  if (/^\d{2}:\d{2}:\d{2}$/g.test(timeStr)) return timeStr;
  if (/^\d{1}:\d{2}:\d{2}$/g.test(timeStr)) return "0" + timeStr;
  if (/^\d{2}:\d{2}$/g.test(timeStr)) return timeStr + ":00";
  if (/^\d{1}:\d{2}$/g.test(timeStr)) return "0" + timeStr + ":00"
  if (/^\d{2}.\d{2}$/g.test(timeStr)) return timeStr.substring(0,2) + ":" + timeStr.substring(3,5) + ":00";
  if (/^\d{1}.\d{2}$/g.test(timeStr)) return "0" + timeStr.substring(0,1) + ":" + timeStr.substring(2,4) + ":00";
  if (/^\d{2}.\d{2}.\d{2}$/g.test(timeStr)) return timeStr.substring(0,2) + ":" + timeStr.substring(3,5) + ":" + timeStr.substring(6,8);
  if (/^\d{1}.\d{2}.\d{2}$/g.test(timeStr)) return "0" + timeStr.substring(0,1) + ":" + timeStr.substring(2,4) + ":" + timeStr.timeStr.substring(5,7);

  return null;

}

function FormatNumber(NumberString) {
  if (/^\d+$/.test(NumberString)) return NumberString;
  return null;
}

function FormatDateStr(number) {
  return number < 10 ? "0" + String(number) : String(number) 
}

/*
 * This module resolves around time and deadlines
 * It also partly exists to offload formatting
*/

import { ClosedDate, Deadline } from "../dataclasses/dataclasses";
import { DAYS, DEADLINE_TYPES, WEEKLY_REPEAT_CHOICES } from "./constants";
import { FormatDateStr, FormatTime, dateToDateString } from "./formatting";



/**
 * Function to get today, mainly here to make testing easier as this can be mocked
 * @returns {Date}
 */
export function getToday(){
  return new Date()
}

/**
 * @idempotence
 * @param {string | Date | {hour : Number, minute : Number, second : Number}} timeStamp
 * @returns {{
 *  hour : Number,
 *  minute : Number,
 *  second : Number,
 * }}
 */
export function getTimeStamp(timeStamp){
  if(typeof timeStamp == "string"){
    timeStamp = FormatTime(timeStamp)
    return {
      hour   : Number(timeStamp.substring(0, 2)),
      minute : Number(timeStamp.substring(3, 5)),
      second : Number(timeStamp.substring(6, 8)),
    }
  }
  if(timeStamp instanceof Date){
    return {
      hour : timeStamp.getHours(),
      minute : timeStamp.getMinutes(),
      second : timeStamp.getSeconds(),
    }
  }

  if (timeStamp.hasOwnProperty('hour')
   && timeStamp.hasOwnProperty('minute')
   && timeStamp.hasOwnProperty('second')){
    return timeStamp
  }

  throw "Unknown timestamp format"
}

export function compareTimeStamp(timeStamp_1, timeStamp_2){
  timeStamp_1 = getTimeStamp(timeStamp_1);
  timeStamp_2 = getTimeStamp(timeStamp_2);

  return {
    hour : timeStamp_1.hour - timeStamp_2.hour,
    minute : timeStamp_1.minute - timeStamp_2.minute,
    second : timeStamp_1.second - timeStamp_2.second,
  }
}



/**
 * So javascript has the american interpretation of days, something to be fixed
 * Post haste
 * @param {Date} date -
 * @returns {Number} 0 - Monday, 1 - Tuesday, ...
 */
export function getDay(date){
  return (date.getDay() + 6) % 7
}

// For deadline calculation we are gonna do a little trick
// In javascript
// new Date(2000, 0, 0) -> 31 dec 1999

/**
 * Calculates a daily deadline from a deadline object and a date
 * @param {Deadline} deadline - the deadline is question, assured to be deadline_type === 0
 * @param {Date} date
 * @returns {Date}
 */
function calculateDailyDeadline(deadline, date){
  const deadline_hour = Number(deadline.deadline_time.substring(0,2))
  const deadline_min = Number(deadline.deadline_time.substring(3,5))

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, deadline_hour, deadline_min)
}


/**
 * Calculates a weekly deadline from a deadline object and a date
 * @param {Deadline} deadline - the deadline is question, assured to be deadline_type === 1
 * @param {Date} date 
 * @returns {Date}
 */
function _calculateWeeklyDeadline(deadline, date){
  const deadline_hour = Number(deadline.deadline_time.substring(0,2))
  const deadline_min = Number(deadline.deadline_time.substring(3,5))

  let deadline_date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, deadline_hour, deadline_min)
  while (getDay(deadline_date) !== deadline.deadline_day){
    deadline_date = new Date(deadline_date.getFullYear(), deadline_date.getMonth(), deadline_date.getDate() - 1, deadline_hour, deadline_min)
  }

  return deadline_date
}


/**
 * Calculates a daily deadline from a deadline object and a date
 * for instance calculate a daily deadline at 12:00 deadline for
 *  a date (4 jule 2023) is the date (12:00 june 3 2023)
 *
 * @param {Deadline} deadline - the deadline is question
 * @param {undefined | Date} date - reference date for the deadline, defaults to today
 * @returns {Date}
 */
export function calculateDeadline(deadline, date){
  if(date === undefined){
    date = getToday();
  }

  if (DEADLINE_TYPES.DAILY === deadline.deadline_type)
    return calculateDailyDeadline(deadline, date)
  if (DEADLINE_TYPES.WEEKLY === deadline.deadline_type)
    return _calculateWeeklyDeadline(deadline, date)
}

export function getTimeString(date){
  const timeStamp = getTimeStamp(new Date(date));
  return `${FormatDateStr(timeStamp.hour)}:${FormatDateStr(timeStamp.minute)}:${FormatDateStr(timeStamp.second)}`
}

/**
 * 
 * @param {Date} date
 * @param {string} timestamp
 * @returns {Date}
 */
export function combineDateAndTimeStamp(date, timestampBlueprint){
  const dateString = dateToDateString(date);
  const timestamp = getTimeStamp(timestampBlueprint)

    return new Date(`${dateString}T${timestamp.hour}:${timestamp.minute}:${timestamp.second}`)
}

export function getWeekNumber(date){
  if(!(date instanceof Date)){
    date = new Date(date);
  }

  const oneJan = new Date(date.getFullYear(),0,1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil(( date.getDay() + 1 + numberOfDays) / 7);
}


/** Checks if a deadline is expired.
 *
 * @param {Deadline} deadline - The deadline in question
 * @param {Date} orderDate - The day that you want to order
 * @param {Map<Number, ClosedDate> | undefined} closedDates - Extra ordinaries days
 * @param {Date | undefined} now -
 * @returns {Boolean} - Returns True if the deadline is expired,
 * so you can't do the the thing or false if you can do the thing
 */
export function expiredDeadline(deadline, orderDate, closedDates,  now){
  if (now === undefined){
    now = getToday();
  }

  if(deadline === undefined){
    return false;
  }

  if (closedDates !== undefined){
    const dateString = dateToDateString(orderDate)
    for(const closedDate of closedDates.values()){
      if (closedDate.close_date === dateString){
        return true;
      }
    }
  }

  const deadlineDate = calculateDeadline(deadline, orderDate);

  return deadlineDate < now;
}

 /** Calculate the amount of days in the month
*
* Programmers Note and complaint
* This takes advantage of javascript date system to largest gold medal.
* Since the "zeroth" day of a month doesn't exists, (* Yeah 0-index is not for days *)
* The date time system creates the last day of the previous month.
* Note that there's not a +1 in front of the month, however here the next parcularity of
* JavaScript's Date system. Months ARE zero indexed, so the +1 is kinda build in.
* Then just select the date
*
*
* @param {*} year
* @param {*} month
* @returns {Date}
*/
export function DaysInAMonth(year, month){
 return new Date(year, month,0).getDate();
};

export function LastMondayInLastMonth(year,month){
  let pivot = 1;
  let pivotDate = new Date(year, month, pivot);
  while((pivotDate.getDay() + 6) % 7 != DAYS.MONDAY){
    pivot--;
    pivotDate = new Date(year, month, pivot);
  }
  return pivot;
};

export function FirstSundayInNextMonth(year,month){
  let pivot = DaysInAMonth(year, month);
  let pivotDate = new Date(year, month, pivot);
  while(pivotDate.getDay() != DAYS.SUNDAY){
    pivot++;
    pivotDate = new Date(year, month, pivot);
  }
  return pivot;
};
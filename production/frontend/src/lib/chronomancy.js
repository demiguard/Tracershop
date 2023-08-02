/*
 * This module resolves around time and deadlines
 * It also partly exists to offload formatting
*/

import { ClosedDate, Deadline } from "../dataclasses/dataclasses";
import { DEADLINE_TYPES, WEEKLY_REPEAT_CHOICES } from "./constants";
import { FormatDateStr, FormatTime, dateToDateString } from "./formatting";



/**
 * Function to get today, mainly here to make testing easier as this can be mocked
 * @returns {Date}
 */
export function getToday(){
  return new Date()
}

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

  console.log(timeStamp)
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

export function combineDateAndTimeStamp(date, timeStamp){
  const dateString = dateToDateString(date);

  return new Date(`${dateString}T${timeStamp}`)
}

export function getWeekNumber(date){
  if(!(date instanceof Date)){
    date = new Date(date);
  }
  const day = getDay(date)
  const oneJan = new Date(date.getFullYear(),0,1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil(( date.getDay() + 1 + numberOfDays) / 7);
}

export function getBitChain(timeSlots, productions){
  let bitChain = 0;

  for(const timeSlot of timeSlots){
    const production = productions.get(timeSlot.production_run);

    if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
      bitChain = bitChain | (1 << production.production_day);
    }

    if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
      bitChain = bitChain | (1 << production.production_day + 7);
    }
  }
  return bitChain;
}

export function evalBitChain(bitChain, date){
  const oddWeekNumber = (getWeekNumber(date) % 2) == 1
  const day = getDay(date);

  return bitChain & (1 << (day + Number(oddWeekNumber) * 7))
}


/** Checks if a deadline is expired.
 *
 * @param {Deadline} deadline - The deadline in question
 * @param {Date} orderDate - The day that you want to order
 * @param {Map<Number, ClosedDate> | undefined} closedDates
 * @param {Date | undefined} now - 
 * @returns {Boolean}
 */
export function expiredDeadline(deadline, orderDate, closedDates,  now){
  if (now === undefined){
    now = getToday();
  }
  if (closedDates !== undefined){
    const dateString = dateToDateString(orderDate)

    for(const closedDate of closedDates.values()){
      if (closedDate.close_date === dateString){
        return false
      }
    }
  }


  const deadlineDate = calculateDeadline(deadline, orderDate);

  return now < deadlineDate
}
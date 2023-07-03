/*
 * This module resolves around time and deadlines
 * It also partly exists to offload formatting
*/

import { Deadline } from "../dataclasses/dataclasses";
import { DEADLINE_TYPES } from "./constants";
import { FormatDateStr, FormatTime } from "./formatting";



/**
 * Function to get today, mainly here to make testing easier as this can be mocked
 * @returns {Date}
 */
export function getToday(){
  return new Date()
}

export function getTimeStamp(timeStamp){
  if(timeStamp instanceof String){
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
  throw "Unknown timestamp format"
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
function calculateWeeklyDeadline(deadline, date){
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
    return calculateWeeklyDeadline(deadline, date)
}

export function getTimeString(date){
  const timeStamp = getTimeStamp(new Date(date));
  return `${FormatDateStr(timeStamp.hour)}:${FormatDateStr(timeStamp.minute)}:${FormatDateStr(timeStamp.second)}`
}
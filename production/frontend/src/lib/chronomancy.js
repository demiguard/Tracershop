/*
 * This module resolves around time and deadlines
 * It also partly exists to offload formatting
 *
 * It's also the most powerful module of all!
*/

import { properModulo } from "~/lib/utils";
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


export function datify(dateLike){
  if(dateLike instanceof Date){
    return dateLike
  } else {
    return new Date(dateLike)
  }
}

export class TimeStamp {
  /** @type {Number} */hour
  /** @type {Number} */minute
  /** @type {Number} */second

  constructor(arg_1, minute, second){
    if(typeof(arg_1) == "string"){
      this.hour = Number(arg_1.substring(0, 2));
      this.minute = Number(arg_1.substring(3, 5));
      this.second = Number(arg_1.substring(6, 8));
    }
    else if(arg_1 instanceof Date){
      this.hour = arg_1.getHours();
      this.minute = arg_1.getMinutes();
      this.second = arg_1.getSeconds();
    }
    else if(arg_1.hasOwnProperty('hour')
         && arg_1.hasOwnProperty('minute')
         && arg_1.hasOwnProperty('second')){
      this.hour = arg_1.hour;
      this.minute = arg_1.minute;
      this.second = arg_1.second;
    } else {
      this.hour = arg_1;
      this.minute = minute;
      this.second = second;
    }

    if(this.hour === undefined ||
       this.minute === undefined ||
       this.second === undefined){
      throw { error : `Unknown timestamp format from string: ${arg_1}, ${minute}, ${second}`};
    }
  }

  /**
   *
   * @returns The number of minutes between this timestamp and 00:00:00
   */
  toMinutes(){
    return this.hour * 60 + this.minute + Math.floor(this.second / 60);
  }

  toVerboseString(){
    let timeString = "";

    if(this.hour === 1){
      timeString += "1 time";
    } else if(this.hour !== 0) {
      timeString += `${this.hour} timer`;
    }

    if(this.minute === 1){
      timeString += " 1 minut";
    } else if(this.minute !== 0) {
      timeString += ` ${this.minute} minutter`;
    }

    return timeString;
  }

  toDisplayString(){
    return `${FormatDateStr(this.hour)}:${FormatDateStr(this.minute)}:${FormatDateStr(this.second)}`;
  }

  addMinutes(minutes){
    this.minute += minutes;

    if(60 < this.minute){
      this.hour = (this.hour + Math.floor(this.minute / 60)) % 24
      this.minute = this.minute % 60;
    } else if(this.minute < 0) {
      const mod_hours = -Math.floor(this.minute / 60) + 1;
      this.hour = properModulo(this.hour - mod_hours, 24);
      this.minute = properModulo(this.minute, 60);
    }
  }

  /**
   *
   * @param {TimeStamp} other
   */
  lessThan(other){
    if(this.hour < other.hour){
      return true;
    } else if(other.hour < this.hour){
      return false;
    }

    if(this.minute < other.minute){
      return true;
    } else if(other.minute < this.minute){
      return false;
    }

    if(this.second < other.second){
      return true;
    } else {
      return false;
    }
  }
}

/** Does a subtration of the two timeStamps equalvivalent to
 * timeStamp_1 - timeStamp_2
 *
 * @param {TimeStamp} timeStamp_1
 * @param {TimeStamp} timeStamp_2
 * @returns {TimeStamp}
 */
export function compareTimeStamp(timeStamp_1, timeStamp_2){
  timeStamp_1 = new TimeStamp(timeStamp_1);
  timeStamp_2 = new TimeStamp(timeStamp_2);

  let hours = timeStamp_1.hour - timeStamp_2.hour
  let minutes = timeStamp_1.minute - timeStamp_2.minute
  let seconds = timeStamp_1.second - timeStamp_2.second

  if (seconds < 0){
    minutes--;
    seconds += 60;
  }
  if(minutes < 0){
    hours--;
    minutes += 60;
  }

  return new TimeStamp({
    hour   : hours,
    minute : minutes,
    second : seconds,
  });
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
  const timeStamp = new TimeStamp(new Date(date));
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
  const timestamp = new TimeStamp(timestampBlueprint)

  return new Date(`${dateString}T${FormatDateStr(timestamp.hour)}:${FormatDateStr(timestamp.minute)}:${FormatDateStr(timestamp.second)}`)
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

export function sameDate(date_1, date_2){
  return date_1.getDate() === date_2.getDate() &&
         date_1.getMonth() === date_2.getMonth() &&
         date_1.getFullYear() === date_2.getFullYear();
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

export class DateRange {
  constructor(startDate, endDate){
    this.startDate = datify(startDate)
    this.endDate = datify(endDate);

    // sorry for the verbose errors, but hopefully it's useful to some
    if(isNaN(this.startDate) && isNaN(this.endDate)){
      throw {
        error : `Unable to convert ${startDate} and ${endDate} to Date objects`
      }
    }
    if(isNaN(this.startDate)){
      throw {
        error : `Unable to convert ${startDate} to Date objects`
      }
    }
    if(isNaN(this.endDate)){
      throw {
        error : `Unable to convert ${endDate} to Date objects`
      }
    }
  }

  in_range(test_date){
    const date = datify(test_date);

    if(isNaN(date)){
      throw {
        error : `Unable to convert ${test_date} to a Date object`
      };
    }
    return this.startDate < date && date < this.endDate;
  }
}

/**
 *
 * @param {Date} date
 * @returns {DateRange}
 */
export function getDateRangeForMonth(input_date){
  const date = datify(input_date)
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return new DateRange(startDate, endDate)
}

export function getDateRangeForDate(input_date){
  const date = datify(input_date)
  const startDate = new Date(date.getFullYear(),
                             date.getMonth(),
                             date.getDate(),
                             0,0,0);
  const endDate = new Date(date.getFullYear(),
                           date.getMonth(),
                           date.getDate(),
                           23, 59, 59);
  return new DateRange(startDate, endDate)
}

export function getDateRangeForWeek(input_date){
  const date = datify(input_date);
  let startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0);
  let endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0);

  while(getDay(startDate) != DAYS.MONDAY){
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 1 , 0,0,0);
  }
  while(getDay(endDate) != DAYS.SUNDAY){
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1 , 0,0,0);
  }

  return new DateRange(startDate, endDate);
}

export function toLotDateString(dateInput){
  const date_ = datify(dateInput);
  return `${date_.getFullYear() - 2000}${FormatDateStr(date_.getMonth()+1)}${FormatDateStr(date_.getDate())}`
}

export function getHour(timeStamp){
  const t = timeStamp instanceof TimeStamp ? timeStamp : new TimeStamp(timeStamp);
  return t.hour;
}
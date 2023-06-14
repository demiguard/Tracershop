import React, { Component } from "react";
import { compareDates } from "../../lib/utils";
import { FormatDateStr } from '../../lib/formatting';
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, DAYS, DAYS_PER_WEEK, CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, DEADLINE_TYPES } from "../../lib/constants";

import PropTypes from 'prop-types'
import { KEYWORD_ActivityProduction_PRODUCTION_DAY, KEYWORD_ClosedDate_CLOSE_DATE } from "../../dataclasses/keywords";
import { Deadline } from "../../dataclasses/dataclasses";

export {Calender, standardOrderMapping, productionGetMonthlyOrders }


const CLOSED_DATE_COLOR = "date-status55";

/** This is a calender, where stuff can be injected on date click and on month change
 *  Alot of functions are in injected into this Component.
 *
 * Props:
 *  date - Initial date for the calender
 *  onMonthChange - function(Date object) -> No return - injected function in response to a user changing the month.
 *  onDayChange -
 *  getColor - function that adds css classes, primarily to add a different color to the date
 */
const CALENDER_PROP_TYPES = {}
CALENDER_PROP_TYPES[CALENDER_PROP_DATE] = PropTypes.objectOf(Date).isRequired;
CALENDER_PROP_TYPES[CALENDER_PROP_GET_COLOR] = PropTypes.func.isRequired;
CALENDER_PROP_TYPES[CALENDER_PROP_ON_DAY_CLICK] = PropTypes.func.isRequired;
CALENDER_PROP_TYPES[CALENDER_PROP_ON_MONTH_CHANGE] = PropTypes.func.isRequired;


class Calender extends Component {
  static propTypes = CALENDER_PROP_TYPES

  constructor(props) {
    super(props);
     // This is because when you change the month in the calender,
     // you should cause other changes
    this.state = {
      activeMonth : this.props[CALENDER_PROP_DATE],
    }
  }

  /** This function is called when the user changes the current month
   *
   * @param {Number} changeBy - This number indicates how many months you wish to change by
   */
  changeMonth(changeBy) {
    const year  = this.state.activeMonth.getFullYear();
    const month = this.state.activeMonth.getMonth() + changeBy;

    const NewMonth = new Date(year, month, 1);

    this.setState({...this.state,
      activeMonth : NewMonth
    });
    this.props[CALENDER_PROP_ON_MONTH_CHANGE](NewMonth);

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
  DaysInAMonth(year, month){
    return new Date(year, month,0).getDate();
  };

  LastMondayInLastMonth(year,month){
    var pivot = 1;
    var pivotDate = new Date(year, month, pivot);
    while((pivotDate.getDay() + 6) % 7 != DAYS.MONDAY){
      pivot--;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  FirstSundayInNextMonth(year,month){
    var pivot = this.DaysInAMonth(year, month);
    var pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != DAYS.SUNDAY){
      pivot++;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

 // ##### Render Functions ##### //
  renderDay(date) {
    const DateObject  = new Date(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth(), date, 12);
    const DateStr     = String(DateObject.getFullYear()) + '-' + FormatDateStr(DateObject.getMonth() + 1) + '-' + FormatDateStr(DateObject.getDate());
    var StatusClass = "calender-row date-base-class " + this.props[CALENDER_PROP_GET_COLOR](DateStr);
    if (this.props[CALENDER_PROP_DATE].getDate() == DateObject.getDate() &&
        this.props[CALENDER_PROP_DATE].getMonth() == DateObject.getMonth() &&
        this.props[CALENDER_PROP_DATE].getFullYear() == DateObject.getFullYear()
     ){
      StatusClass += " today";
    }

    return (
      <div className={StatusClass}  onClick={() => this.props[CALENDER_PROP_ON_DAY_CLICK](DateObject)}> {DateObject.getDate()}</div>
    );
  }

  renderWeek(startingDate) {
    return(
      <div className="d-flex weekrow" key={startingDate}>
        {this.renderDay(startingDate)}
        {this.renderDay(startingDate + 1)}
        {this.renderDay(startingDate + 2)}
        {this.renderDay(startingDate + 3)}
        {this.renderDay(startingDate + 4)}
        {this.renderDay(startingDate + 5)}
        {this.renderDay(startingDate + 6)}
      </div>
    );
  }

  render() {
    var startingDate = this.LastMondayInLastMonth(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth())
    const EndingDate = this.FirstSundayInNextMonth(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth())

    const weeks = [];

    while (startingDate <= EndingDate) {
      weeks.push((this.renderWeek(startingDate)));
      startingDate += DAYS_PER_WEEK;
    }

    return (
    <div className="calender">
      <div className="calender-header flex-row d-flex justify-content-around">
        <div onClick={() => this.changeMonth(-1)}>
          <img className="tableButton" id="DecrementMonth" alt="Sidste" src="/static/images/prev.svg"/>
        </div>
        <div>
          {this.state.activeMonth.toLocaleString('default', {month:"long"})}
        </div>
        <div onClick={() => this.changeMonth(1)}>
          <img className="tableButton" id="IncreaseMonth" alt="Næste" src="/static/images/next.svg"/>
        </div>
      </div>
        <div className="calender-dates d-flex">
          <div className="calender-row"> Man</div>
          <div className="calender-row"> Tir</div>
          <div className="calender-row"> Ons</div>
          <div className="calender-row"> Tor</div>
          <div className="calender-row"> Fre</div>
          <div className="calender-row"> Lør</div>
          <div className="calender-row"> Søn</div>
        </div>
      {weeks}
    </div>);
  }
}


function standardOrderMapping(orders, tOrders, runs, closedDate) {
  // Maybe do this calculation once instead of 30 times
  const closedDateSet = new Set();
  for(const [BDID, cdate] of closedDate){
    closedDateSet.add(cdate.ddate)
  }

  const retFunc = (DateStr) => {
    if (closedDateSet.has(DateStr)) return "date-status55";

    var MinimumActivityStatus = 5;
    var MinimumInjectionStatus = 5;
    const date = new Date(DateStr);
    for(const [_, ActivityOrder] of orders){
      if(compareDates(date, new Date(ActivityOrder.deliver_datetime))){
        MinimumActivityStatus = Math.min(MinimumActivityStatus, ActivityOrder.status);
      }
    }
    for(const [_, InjectionOrder] of tOrders){
      if(compareDates(date, new Date(InjectionOrder.deliver_datetime))){
        MinimumInjectionStatus = Math.min(MinimumInjectionStatus, InjectionOrder.status);
      }
    }
    if (MinimumActivityStatus == 5){
      var CanProduce = false;
      for(const [_PTID, Run] of runs){
        if(Run.day == date.getDay()){
          CanProduce = true;
          break;
        }
      }
      if(CanProduce){
        const now = new Date();
        if(date > now){
          MinimumActivityStatus = 0;
        }
      }
    }
    return "date-status" + String(MinimumInjectionStatus) + String(MinimumActivityStatus);
  }
  return retFunc;
}

export function getColorProduction(
  activity_deadline,
  injection_deadline,
  // Maps
  activity_orders,
  closed_dates,
  injection_orders,
  productions,
) {
  const closedDateSet = new Set();
  for(const [BDID, closed_date] of closed_dates){
    closedDateSet.add(closed_date[KEYWORD_ClosedDate_CLOSE_DATE]) // Change this to a keyword
  }

  const retFunc = (date_string) => {
    const date = new Date(date_string);
    // Javascript have 0 sunday, 1 monday, ...
    // Javascript ALSO HAVE -1 % 7 = -1 instead of 6
    const day = (date.getDay() + 6) % 7;

    let activity_color_id = 5;
    let injection_color_id = 5;

    for(const [production_id, production] of productions){
      if (production[KEYWORD_ActivityProduction_PRODUCTION_DAY] === day){
        activity_color_id = 0;
        injection_color_id = 0;
      }
    }

    const today = new Date()
    if(activity_deadline){
      const deadline_date = calculateDeadline(activity_deadline, date);
      if (deadline_date < today) {
        activity_color_id = 5;
      }
    }
    if(injection_deadline){
      const deadline_date = calculateDeadline(injection_deadline, date);
      if (deadline_date < today) {
        injection_color_id = 5;
      }
    }

    return "date-status" + injection_color_id + activity_color_id;
  }
  return retFunc
}

function productionGetMonthlyOrders(websocket){
  const retFunc = (NewMonth) => {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    websocket.send(message);
  }
  return retFunc
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
  while ((deadline_date.getDay() + 6) % 7 !== deadline.deadline_day){
    deadline_date = new Date(deadline_date.getFullYear(), deadline_date.getMonth(), deadline_date.getDate() - 1, deadline_hour, deadline_min)
  }

  return deadline_date
}


/**
 * Calculates a daily deadline from a deadline object and a date
 * @param {Deadline} deadline - the deadline is question, assured to be deadline_type === 0
 * @param {Date} date 
 * @returns {Date}
 */
function calculateDeadline(deadline, date){
  if (DEADLINE_TYPES.DAILY === deadline.deadline_type)
    return calculateDailyDeadline(deadline, date)
  if (DEADLINE_TYPES.WEEKLY === deadline.deadline_type)
    return calculateWeeklyDeadline(deadline, date)

}
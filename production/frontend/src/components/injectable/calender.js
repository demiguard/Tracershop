import React, { Component } from "react";
import { compareDates } from "../../lib/utils";
import { FormatDateStr } from '../../lib/formatting';
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, DAYS, DAYS_PER_WEEK } from "../../lib/constants";

import PropTypes from 'prop-types'

export {Calender, standardOrderMapping, productionGetMonthlyOrders }


/** This is a calender, where stuff can be injected on date click and on month change
 *  Alot of functions are in injected into this Component.
 *
 * Props:
 *  date - Initial date for the calender
 *  onMonthChange - function(Date object) -> No return - injected function in response to a user changing the month.
 *  onDayChange -
 *  getColor - function that adds css classes, primarily to add a different color to the date
 */
class Calender extends Component {
  static propTypes = {
    date: PropTypes.objectOf(Date).isRequired,
    getColor: PropTypes.func.isRequired,
    onDayClick: PropTypes.func.isRequired,
    onMonthChange: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
     // This is because when you change the month in the calender,
     // you should cause other changes
    this.state = {
      activeMonth : this.props.date,
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
    this.props.onMonthChange(NewMonth);

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
    while(pivotDate.getDay() != DAYS.MONDAY){
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
    var StatusClass = "calender-row date-base-class " + this.props.getColor(DateStr);
    if (this.props.date.getDate() == DateObject.getDate() &&
          this.props.date.getMonth() == DateObject.getMonth() &&
          this.props.date.getFullYear() == DateObject.getFullYear()
     ){
      StatusClass += " today";
    }

    return (
      <div className={StatusClass}  onClick={() => this.props.onDayClick(DateObject)}> {DateObject.getDate()}</div>
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
          <div className="calender-row"> Søn</div>
          <div className="calender-row"> Man</div>
          <div className="calender-row"> Tir</div>
          <div className="calender-row"> Ons</div>
          <div className="calender-row"> Tor</div>
          <div className="calender-row"> Fre</div>
          <div className="calender-row"> Lør</div>
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

function productionGetMonthlyOrders(websocket){
  const retFunc = (NewMonth) => {
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    websocket.send(message);
  }
  return retFunc
}
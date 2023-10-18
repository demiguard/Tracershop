import React, { useState } from "react";

import { compareDates } from "~/lib/utils";

import { DAYS, DAYS_PER_WEEK, CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR,
  CALENDER_PROP_ON_DAY_CLICK, ORDER_STATUS, COLORS } from "~/lib/constants";

import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS } from "~/lib/shared_constants"

import PropTypes from 'prop-types'

import { useWebsocket } from "../tracer_shop_context";

export const STATUS_COLORS = {
  [ORDER_STATUS.AVAILABLE] : "#d6d6d6",
  [ORDER_STATUS.ORDERED] : "#F55" ,
  [ORDER_STATUS.ACCEPTED] : "#FF5",
  [ORDER_STATUS.RELEASED] : "#5F5",
  [ORDER_STATUS.UNAVAILABLE] : "#858585",
}



/** This is a calender, where stuff can be injected on date click and on month change
 *  Alot of functions are in injected into this Component.
 *
 * Props:
 *  date - Initial date for the calender
 *  onMonthChange - function(Date object) -> No return - injected function in response to a user changing the month.
 *  onDayChange -
 *  getColor - function that adds css classes, primarily to add a different color to the date
 */
const CALENDER_PROP_TYPES = {
  [CALENDER_PROP_DATE] : PropTypes.objectOf(Date).isRequired,
  [CALENDER_PROP_GET_COLOR] : PropTypes.func.isRequired,
  [CALENDER_PROP_ON_DAY_CLICK] : PropTypes.func.isRequired,
}


export function Calender({calender_date,
                          calender_get_color,
                          calender_on_day_click,

                        }) {

  const websocket = useWebsocket();
  const [activeMonth, setActiveMonth] = useState(calender_date);

  /** This function is called when the user changes the current month
   *
   * @param {Number} changeBy - This number indicates how many months you wish to change by
   */
  function changeMonth(changeBy) {
    const year  = activeMonth.getFullYear();
    const month = activeMonth.getMonth() + changeBy;

    const NewMonth = new Date(year, month, 1, 12);

    setActiveMonth(NewMonth)
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    websocket.send(message);
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
  function DaysInAMonth(year, month){
    return new Date(year, month,0).getDate();
  };

  function LastMondayInLastMonth(year,month){
    let pivot = 1;
    let pivotDate = new Date(year, month, pivot);
    while((pivotDate.getDay() + 6) % 7 != DAYS.MONDAY){
      pivot--;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  function FirstSundayInNextMonth(year,month){
    let pivot = DaysInAMonth(year, month);
    let pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != DAYS.SUNDAY){
      pivot++;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

 // ##### Render Functions ##### //
 /**
  * A day in the calender
  * @param {{
  *   date : Number - date of active month, note that this date may correspond to a none existent
  *          date of the month. such a 32 of Jan, this would mean the day that would be rendered
  *          is the first of Feb
  * }} props
  * @returns {Element}
  */ 
 function Day({date}) {
    const dateObject  = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), date, 12);
    const [backGroundColor, borderColor] = calender_get_color(date);

    const styles = {
        width : "17%",
        border: "5px",
        borderColor : borderColor,
        borderStyle: "solid",
        borderRadius: "100%",
        padding: "3px",
        margin: "3px",
        backgroundColor : backGroundColor,
    }

    if (compareDates(calender_date, dateObject)){
      styles.fontSize = "large";
      styles.color = "blue";
    }

    return (
      <div
        style={styles}
        aria-label={`calender-day-${dateObject.getDate()}`}
        onClick={() => calender_on_day_click(dateObject)}> {dateObject.getDate()}</div>
    );
  }

  function Week({startingDate}) {
    return(
      <div className="d-flex weekrow">
        <Day date={startingDate}/>
        <Day date={startingDate + 1}/>
        <Day date={startingDate + 2}/>
        <Day date={startingDate + 3}/>
        <Day date={startingDate + 4}/>
        <Day date={startingDate + 5}/>
        <Day date={startingDate + 6}/>
      </div>
    );
  }

  let startingDate = LastMondayInLastMonth(activeMonth.getFullYear(), activeMonth.getMonth())
  const EndingDate = FirstSundayInNextMonth(activeMonth.getFullYear(), activeMonth.getMonth())

    const weeks = [];

    while (startingDate <= EndingDate) {
      weeks.push((<Week startingDate={startingDate} key={weeks.length + 1} />));
      startingDate += DAYS_PER_WEEK;
    }

    return (
    <div style={{
      padding: "0px",
      margin: "auto",
      marginTop: "46px",
      border: "5px",
      borderColor: "blue",
      borderStyle: "solid",
      width: "260px",
      textAlign: "center",
      borderRadius: "8px",
      lineHeight: "20px",
      verticalAlign: "middle",
    }}>
      <div
        style={{
          background : COLORS.tertiaryColor3
        }}
        className="calender-header flex-row d-flex justify-content-around"
      >
        <div onClick={() => changeMonth(-1)}>
          <img
            aria-label="prev-month"
            className="tableButton"
            id="DecrementMonth"
            alt="Sidste"
            src="/static/images/prev.svg"/>
        </div>
        <div>
          {activeMonth.toLocaleString('default', {month:"long"})}
        </div>
        <div onClick={() => changeMonth(1)}>
          <img
            aria-label="next-month"
            className="tableButton" id="IncreaseMonth" alt="Næste" src="/static/images/next.svg"/>
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

Calender.propTypes = CALENDER_PROP_TYPES;

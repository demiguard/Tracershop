import React, { useState } from "react";

import { compareDates } from "~/lib/utils";

import { DAYS_PER_WEEK, CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR,
  CALENDER_PROP_ON_DAY_CLICK, ORDER_STATUS, COLORS } from "~/lib/constants";

import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS } from "~/lib/shared_constants"

import PropTypes from 'prop-types'

import { FirstSundayInNextMonth, LastMondayInLastMonth, datify, expiredDeadline } from "~/lib/chronomancy";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { dateToDateString } from "~/lib/formatting";
import { BitChain, OrderDateMapping } from "~/lib/data_structures";
import { MonthSelector } from "~/components/injectable/month_selector";
import { UpdateToday } from "~/lib/state_actions";
import { FONT_SIZE } from "~/lib/styles";


export const CALENDER_STYLE = {
  padding: "0px",
  margin: "auto",
  marginTop: "46px",
  border: "5px",
  borderColor: "blue",
  borderStyle: "solid",
  width: "100%",
  textAlign: "center",
  borderRadius: "8px",
  lineHeight: "20px",
  verticalAlign: "middle",
};


export const WEEK_STYLE = {
  aspectRatio : 7
}
export const BASE_DAY_STYLE = {
  display : "flex",
  width : "17%",
  border: "8px",
  borderStyle: "solid",
  borderRadius: "100%",
  padding: "3px",
  margin: "3px",
  alignItems : "center",
  justifyContent : "center",
  ...FONT_SIZE.em1p25
}

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
  [CALENDER_PROP_DATE] : PropTypes.instanceOf(Date).isRequired,
  [CALENDER_PROP_ON_DAY_CLICK] : PropTypes.func.isRequired,
  filter_activity_orders : PropTypes.func.isRequired,
  filter_injection_orders : PropTypes.func.isRequired,
  bit_chain : PropTypes.instanceOf(BitChain).isRequired,
}

//#region Day
 /**
  * A day in the calender
  * @param {{
 *   date : Number - date of active month, note that this date may correspond to a none existent
 *          date of the month. such a 32 of Jan, this would mean the day that would be rendered
 *          is the first of Feb
 * }} props
 * @returns {Element}
 */
function Day({date, calender_date, colorMap, calender_on_day_click, activeMonth}) {
   const dateObject  = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), date, 12);
   const dateString = dateToDateString(dateObject)
   const [backGroundColor, borderColor] = (colorMap.has(dateString)) ?  colorMap.get(dateString) : ["#FF00FF", "#FF00FF"];

   const styles = {
    ...BASE_DAY_STYLE,
    borderColor : borderColor,
    backgroundColor : backGroundColor,
   }
   if (compareDates(calender_date, dateObject)){
     styles.fontFamily = "MariPoster"
     styles.fontSize = "1.5em";
   }

   return (
     <div
       style={styles}
       aria-label={`calender-day-${dateObject.getDate()}`}
       onClick={() => calender_on_day_click(dateObject)}> {dateObject.getDate()}</div>
   );
 }

//#region Week

function Week({activeMonth,
               calender_date,
               startingDate,
               colorMap,
               calender_on_day_click
}) {
  return(
    <div style={WEEK_STYLE} className="d-flex">
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 1}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 2}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 3}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 4}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 5}/>
      <Day calender_date={calender_date} activeMonth={activeMonth} calender_on_day_click={calender_on_day_click} colorMap={colorMap} date={startingDate + 6}/>
    </div>
  );
}


export function Calender({calender_date,
                          calender_on_day_click,
                          filter_activity_orders,
                          filter_injection_orders,
                          bit_chain,
                        }) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const dispatch = useTracershopDispatch();
  const [activeMonth, setActiveMonth] = useState(calender_date);

  function getColorMap(
      state,
      bit_chain,
      filter_activity_orders,
      filter_injection_orders
  ){
    const colorMap = new Map();

    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();

    const server_config = state.server_config.get(1)
    const activity_deadline = (server_config !== undefined) ?
      state.deadline.get(server_config.global_activity_deadline) : undefined;
    let injection_deadline = (server_config !== undefined) ?
      state.deadline.get(server_config.global_injection_deadline) : undefined;

    const dateInjectionMapping = new OrderDateMapping([...state.injection_orders.values()].filter(filter_injection_orders));
    const dateActivityMapping = new OrderDateMapping([...state.activity_orders.values()].filter(filter_activity_orders));

    const lastMondayOffset = new Date(year, month -1,  LastMondayInLastMonth(year, month - 1));
    let pivot = lastMondayOffset;
    const firstSundayOffset = new Date(year, month + 1,  FirstSundayInNextMonth(year, month + 1));

    while(!compareDates(pivot, firstSundayOffset)){
      const dateString = dateToDateString(pivot);
      let activity_color_id =  ORDER_STATUS.UNAVAILABLE;
      let injection_color_id = ORDER_STATUS.UNAVAILABLE;
      if (bit_chain.eval(pivot) && !expiredDeadline(activity_deadline, pivot)){
        activity_color_id = ORDER_STATUS.AVAILABLE;
      }

      if (!expiredDeadline(injection_deadline, pivot)){
        injection_color_id = ORDER_STATUS.AVAILABLE;
      }

      if(dateActivityMapping.has_status_for_date(dateString)){
        activity_color_id = dateActivityMapping.get_status_for_date(dateString);
      }

      if(dateInjectionMapping.has_status_for_date(dateString)){
        injection_color_id = dateInjectionMapping.get_status_for_date(dateString);
      }

      colorMap.set(dateString, [STATUS_COLORS[activity_color_id],
                                STATUS_COLORS[injection_color_id]]);

      pivot = new Date(pivot.getFullYear(), pivot.getMonth(), pivot.getDate() + 1);
    }

    for(const closed_date of state.closed_date.values()){
      colorMap.set(closed_date.close_date, [STATUS_COLORS[ORDER_STATUS.UNAVAILABLE],
                                            STATUS_COLORS[ORDER_STATUS.UNAVAILABLE]]);
    }

    return colorMap;
  }
  const colorMap = getColorMap(state, bit_chain, filter_activity_orders, filter_injection_orders);

  /** This function is called when the user changes the current month
   *
   * @param {Number} changeBy - This number indicates how many months you wish to change by
   */
  function changeMonthCallback(newMonth) {
    dispatch(new UpdateToday(datify(newMonth), websocket))
  }

  let startingDate = LastMondayInLastMonth(activeMonth.getFullYear(), activeMonth.getMonth())
  const EndingDate = FirstSundayInNextMonth(activeMonth.getFullYear(), activeMonth.getMonth())
  const weeks = [];

  while (startingDate <= EndingDate) {
    weeks.push((<Week
                  calender_date={calender_date}
                  calender_on_day_click={calender_on_day_click}
                  activeMonth={activeMonth}
                  colorMap={colorMap}
                  startingDate={startingDate}
                  key={weeks.length + 1}
                />));
    startingDate += DAYS_PER_WEEK;
  }

  return (
    <div style={CALENDER_STYLE}>
      <div
        style={{
          background : COLORS.tertiaryColor3
        }}
        className="calender-header flex-row d-flex justify-content-around"
      >
        <MonthSelector
          stateDate={calender_date}
          setDate={setActiveMonth}
          callback={changeMonthCallback}
          calender_on_day_click={calender_on_day_click}
        />
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

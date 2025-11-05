import React, { useRef, useState } from "react";

import { DAYS_PER_WEEK, ORDER_STATUS, COLORS } from "~/lib/constants";

import { FirstSundayInNextMonth, LastMondayInLastMonth, addDaysToDates, datify, expiredDeadline, fixDateTo12AClock, sameDate } from "~/lib/chronomancy";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { dateToDateString } from "~/lib/formatting";

import { MonthSelector } from "~/components/injectable/month_selector";
import { UpdateToday } from "~/lib/state_actions";
import { FONT_SIZE } from "~/lib/styles";
import { useColorMap } from "~/contexts/calender_color_map";
import { CalenderDay } from "./calender_day";
import { useContainerDimensions } from "~/effects/dimensions";
import { TracershopInputGroup } from "./inputs/tracershop_input_group";
import { FormControl } from "react-bootstrap";


export const CALENDER_STYLE: React.CSSProperties = {
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
  [ORDER_STATUS.EMPTY] : "#858585",
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

//#region Day
 /**
  * A day in the calender
 */
function Day({icon_size, date, calender_on_day_click}) {
  const dateString = dateToDateString(date)
  const colorMap = useColorMap();

  const orderColor= colorMap.get(dateString);

  return (
    <div
      aria-label={`calender-day-${date.getDate()}`}
      onClick={() => calender_on_day_click(date)}
    >
      <CalenderDay
        height={icon_size}
        width={icon_size}
        day={date.getDate()}
        orderColor={orderColor}
      />
    </div>
  );
 }

//#region Week

function Week({startingDate,
               calender_on_day_click,
               iconSize,
}) {


  return(
    <div style={WEEK_STYLE} className="d-flex">
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 0)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 1)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 2)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 3)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 4)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 5)}/>
      <Day icon_size={iconSize} calender_on_day_click={calender_on_day_click} date={addDaysToDates(startingDate, 6)}/>
    </div>
  );
}


export function Calender3Part({ calender_on_day_click }) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const dispatch = useTracershopDispatch();
  const [activeMonth, setActiveMonth] = useState(state.today);
  const [renderPhase, setRenderPhase] = useState(0);



  const calenderRef = useRef(null);
  const containerSize = useContainerDimensions(calenderRef)

  const {width, height } = containerSize;

  const iconSize = Math.min(width, height) / 7;

  /** This function is called when the user changes the current month
   */
  function changeMonthCallback(newMonth) {
    dispatch(new UpdateToday(datify(newMonth), websocket))
  }

  let startingDate = fixDateTo12AClock(LastMondayInLastMonth(activeMonth))
  const EndingDate = fixDateTo12AClock(FirstSundayInNextMonth(activeMonth))
  const weeks = [];

  while (startingDate <= EndingDate) {
    weeks.push((<Week
                  iconSize={iconSize}
                  calender_on_day_click={calender_on_day_click}
                  startingDate={startingDate}
                  key={weeks.length + 1}
                />));
    startingDate = addDaysToDates(startingDate, DAYS_PER_WEEK);
  }

  return (
    <div style={CALENDER_STYLE} ref={calenderRef}>
      <div
        style={{
          background : COLORS.tertiaryColor3
        }}
        className="calender-header flex-row d-flex justify-content-around"
      >
        <MonthSelector
          stateDate={state.today}
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
        <div ref={calenderRef}>
          {weeks}
        </div>
    </div>);
}

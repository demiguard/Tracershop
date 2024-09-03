// Third party imports
import React, { useRef, useState } from "react";
import { Button, Col, FormControl, Row } from "react-bootstrap";

// Tracershop imports imports
import { StaticCanvas } from "~/components/injectable/canvas";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { ActivityOrder, InjectionOrder, TracershopState } from "~/dataclasses/dataclasses";
import { TimeStamp, compareTimeStamp, datify, getDateRangeForMonth, getSiteDate, setSiteDate } from "~/lib/chronomancy";
import { ORDER_STATUS, TRACER_TYPE } from "~/lib/constants";
import { useContainerDimensions } from "~/effects/dimensions";
import { activityOrdersFilter, injectionOrdersFilter } from "~/lib/filters";
import { Optional } from "~/components/injectable/optional";
import { HoverBox } from "~/components/injectable/hover_box";
import { MonthSelector } from "~/components/injectable/month_selector";
import { UpdateToday } from "~/lib/state_actions";
import { MARGIN } from "~/lib/styles";

const colors = ["#55FF88", "#FFEE44", "#AA0033", "#3300AA"];
const texts = [
    "Frigivet til tiden",
    "Forsinket max 30 min",
    "Forsinket mere end 30 min",
    "Ej frigivet",
];

//#region Separators
/**
 *
 * @param {Array<InjectionOrder} injectionOrders
 * @returns {{
 *   total : Number,
 *   releasedOnTime : Number,
 *   releasedDelayed30 : Number,
 *   releasedDelayed30Plus : Number
 *   notReleased : Number
 *   percentages : Array<Number>
 * }}
 */
export function separatorInjectionOrders(injectionOrders){
  const now = new Date()
  let total = 0;
  let releasedOnTime = 0;
  let releasedDelayed30 = 0;
  let releasedDelayed30Plus = 0;
  let notReleased = 0;

  // TODO: refactor
  for(const order of injectionOrders){
    if(order.status == ORDER_STATUS.RELEASED
      || order.status == ORDER_STATUS.ACCEPTED){

      if(order.status == ORDER_STATUS.ACCEPTED){
        if(datify(order.delivery_date) < now){
          total++;
          notReleased++;
        }
        continue;
      }

      total++;
      const releaseTimeStamp = new TimeStamp(new Date(order.freed_datetime));
      const deliveryTimeStamp = new TimeStamp(order.delivery_time)

      const timeDifference = compareTimeStamp(releaseTimeStamp,
                                              deliveryTimeStamp).toMinutes();

      if(timeDifference <= 0){
        releasedOnTime++;
      } else if(timeDifference < 30){
        releasedDelayed30++;
      } else {
        releasedDelayed30Plus++;
      }
    }
  }

  return {
    total : total,
    releasedOnTime : releasedOnTime,
    releasedDelayed30 : releasedDelayed30,
    releasedDelayed30Plus : releasedDelayed30Plus,
    notReleased : notReleased,
    percentages : [releasedOnTime / total,
                   releasedDelayed30 / total,
                   releasedDelayed30Plus / total,
                   notReleased / total
                  ]
  };
}

/**
 *
 * @param {Array<ActivityOrder>} activity_orders
 * @param {TracershopState} state
 * @returns
 */
export function separatorActivityOrders(activity_orders, state){
  const now = new Date()
  let total = 0;
  let releasedOnTime = 0;
  let releasedDelayed30 = 0;
  let releasedDelayed30Plus = 0;
  let notReleased = 0;

  for(const activity_order of activity_orders){
    if(activity_order.status == ORDER_STATUS.ACCEPTED){
      if(datify(activity_order.delivery_date) < now){
        total++;
        notReleased++;
      }
      continue;
    }

    total++;
    const releaseTimeStamp = new TimeStamp(new Date(activity_order.freed_datetime));
    const deliveryTimeSlot = activity_order.moved_to_time_slot ?
        state.deliver_times.get(activity_order.moved_to_time_slot)
      : state.deliver_times.get(activity_order.ordered_time_slot);

    const deliveryTimeStamp = new TimeStamp(deliveryTimeSlot.delivery_time);

    const timeDifference = compareTimeStamp(releaseTimeStamp,
                                            deliveryTimeStamp).toMinutes();
    if(timeDifference <= 0){
      releasedOnTime++;
    } else if(timeDifference < 30){
      releasedDelayed30++;
    } else {
      releasedDelayed30Plus++;
    }
  }

  return {
    total : total,
    releasedOnTime : releasedOnTime,
    releasedDelayed30 : releasedDelayed30,
    releasedDelayed30Plus : releasedDelayed30Plus,
    notReleased : notReleased,
    percentages : [releasedOnTime / total, releasedDelayed30 / total, releasedDelayed30Plus / total, notReleased / total]
  };
}

//#region Component
export function MonitorPage({}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const dispatch = useTracershopDispatch();
  const componentRef = useRef(null);

  const [activeMonth, setActiveMonth] = useState(state.today);
  const [activeTracer, setActiveTracer] = useState(-1);
  const { width } = useContainerDimensions(componentRef);
  const canvasHeight = width * 9 / 16;

  const dateRange = getDateRangeForMonth(activeMonth);

  //#region Buttons
  const buttonRows = [];
  for(const tracer of state.tracer.values()){
    if(tracer.tracer_type === TRACER_TYPE.ACTIVITY){
      const buttonHTML = (
          <Button
            style={MARGIN.leftRight.px15}
            key={tracer.id}
            onClick={() => {setActiveTracer(() => {return tracer.id;})}}
            size="sm"
          >
            {tracer.shortname}
          </Button>
      );

      buttonRows.push(buttonHTML);
    }
  }
  const injectionHTML = (
    <Button key={-1}
        style={MARGIN.leftRight.px15}
        onClick={() => {setActiveTracer(() => {return -1;})}}
        size="sm"
    >
      Special
    </Button>
  );
  buttonRows.push(injectionHTML);
  const excel_button = (
    <Button
    key={-2}
    style={MARGIN.leftRight.px15}
    onClick={
      () => {
        window.open(`excel/${activeMonth.getFullYear()}/${activeMonth.getMonth() + 1}/data.xlsx`)
      }
    }
    size="sm"
      >
      Hent Excel ark
    </Button>
  )
  buttonRows.push(excel_button);

  const tracerName = (() => {
    if(state.tracer.has(activeTracer)){
      const tracer = state.tracer.get(activeTracer);
      return tracer.shortname;
    }

    return "Injections tracer";
  })();

  const separator = (() => {
    if (0 < activeTracer) {
      const orders = activityOrdersFilter(state,  {
          timeSlotFilterArgs : { tracerID : activeTracer },
          status : [ORDER_STATUS.ACCEPTED, ORDER_STATUS.RELEASED],
          dateRange : dateRange
        })

      return separatorActivityOrders(orders, state);
    } else {
      const orders = injectionOrdersFilter(state, {
        status : [ORDER_STATUS.ACCEPTED,ORDER_STATUS.RELEASED],
        dateRange : dateRange
      });

      return separatorInjectionOrders(orders, state);
    }
  })();
  /**
   *
   * @param {CanvasRenderingContext2D} context
   */
  function draw(context){
    context.clearRect(0,0, context.canvas.width, context.canvas.height)
    if (separator.total === 0){
      return;
    }
    let startAngle = 3 * Math.PI / 2;

    const circleCenterAbscissa = context.canvas.width / 2;
    const circleCenterOrdinate = context.canvas.height / 2;
    const circle_radius = 0.8 * Math.min(circleCenterOrdinate, circleCenterAbscissa);

    context.font = "32px MariBook";
    context.fillStyle = "#000000";
    const headerLength = context.measureText(tracerName);

    context.fillText(tracerName, circleCenterAbscissa - headerLength.width / 2, 32);

    const boxWidth = 25;
    const boxAbscissa = circleCenterAbscissa + circle_radius;
    const textAbscissa = boxAbscissa + boxWidth * 2;
    let boxOrdinateStart = context.canvas.height / 10;
    let textOrdinateStart = context.canvas.height / 10 + boxWidth - 5;
    const percentages = separator.percentages;

    for(let i = 0; i < percentages.length; i++){
      if(percentages[i] != 0.0){
        const percentage = percentages[i];
        context.fillStyle = colors[i];
        context.strokeStyle = colors[i];

        let endAngle = startAngle - 2 * Math.PI * percentage;

        context.beginPath();
        context.arc(circleCenterAbscissa,circleCenterOrdinate,circle_radius, startAngle, endAngle, true);
        context.lineTo(circleCenterAbscissa,circleCenterOrdinate);
        context.fill();

        context.strokeStyle = "#000000";
        context.lineWidth = 2;
        context.fillRect(boxAbscissa, boxOrdinateStart, boxWidth, boxWidth)
        context.strokeRect(boxAbscissa, boxOrdinateStart, boxWidth, boxWidth)

        context.font = "20px MariBook"
        context.fillStyle = "#000000"
        context.fillText(texts[i] + ` ${Math.round(percentage * 100)}%`, textAbscissa, textOrdinateStart);

        boxOrdinateStart += boxWidth * 2.5;
        textOrdinateStart += boxWidth * 2.5;

        startAngle = endAngle;
      }
    }
  }


  const statsDiv = (
    <div>
      <div>Ordre I alt: {separator.total}</div>
      <div>Ordre Behandlet til tiden: {separator.releasedOnTime}</div>
      <div>Ordre Forsinket mindre end 30 minutter: {separator.releasedDelayed30}</div>
      <div>Ordre Forsinket mere end 30 minutter: {separator.releasedDelayed30Plus}</div>
      <div>Ej Frigivet: {separator.notReleased}</div>
    </div>
  )

  return (<div ref={componentRef}>
    <Row className="justify-content-md-start">
      <Col>
        {buttonRows}
      </Col>
      <Col>
        <MonthSelector
          stateDate={activeMonth}
          setDate={setActiveMonth}
          callback={(newActiveMonth) => {
            dispatch(new UpdateToday(newActiveMonth, websocket));
          }}
        />
      </Col>
    </Row>
    <Optional exists={separator.total !== 0}>
      <HoverBox
        Base={<StaticCanvas draw={draw} width={width} height={canvasHeight}/>}
        Hover={statsDiv}
      />
    </Optional>
  </div>);
}
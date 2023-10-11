import React, { useState } from "react";
import { Button, Container, Row, Col } from 'react-bootstrap';
import { InjectionTable } from './injection_table.js';
import { ActivityTable } from './activity_table.js';
import { TRACER_TYPE, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE, KEYWORD_ID,
  CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE,
  CALENDER_PROP_DATE, 
  DATABASE_ACTIVE_TRACER,
  DATABASE_TODAY} from "~/lib/constants.js";
import { DATA_PRODUCTION, DATA_ACTIVITY_ORDER, DATA_TRACER, DATA_INJECTION_ORDER,
  DATA_CLOSED_DATE, DATA_SERVER_CONFIG, DATA_DEADLINE } from "~/lib/shared_constants.js";
import { db } from "~/lib/local_storage_driver.js";

import { Calender, getColorProduction, productionGetMonthlyOrders } from "../injectable/calender.js";

import SiteStyles from '~/css/Site.module.css'
import { KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE, KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE } from "~/dataclasses/keywords.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";

const Tables = {
  activity : ActivityTable,
  injections : InjectionTable
};

export function OrderPage() {
  const state = useTracershopState();
  const websocket = useWebsocket();

  let /**@type {Date} */ today = db.get(DATABASE_TODAY);
  if(!today || !today instanceof Date){
    today = new Date();
  }

  let /**@type {Number | null} */ activeTracerInit = db.get(DATABASE_ACTIVE_TRACER);
  if(!activeTracerInit) {
    const tracers = [...state.tracer.values()].filter(
      (tracer) => {return tracer.tracer_type === TRACER_TYPE.ACTIVITY}
    ).sort((a, b) => {return b.id - a.id})

    activeTracerInit = tracers.length ? tracers[0].id : -1;
    db.set(DATABASE_ACTIVE_TRACER, activeTracerInit);
  }

  const activeTableInit = (activeTracerInit == -1) ? "injections" : "activity";

  const [activeDate, _setActiveDate] = useState(today);
  const [activeTracer, setActiveTracer] = useState(activeTracerInit);
  const [activeTable, setActiveTable] = useState(activeTableInit);

  // Calender functions
  function setActiveDate(NewDate) {
    db.set(DATABASE_TODAY, NewDate);
    _setActiveDate(NewDate)
  }

  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  function renderTableSwitchButton(tracer) {
    const underline = tracer.id === state.activeTracer;

    return (
      <Button className={SiteStyles.Margin15lr} key={tracer.shortname} sz="sm" onClick={() => {
        db.set("activeTracer", tracer.id);
        setActiveTracer(tracer.id)
        setActiveTable("activity")
        }}
      >
        {underline ? <u>{tracer.shortname}</u> : tracer.shortname}
      </Button>
    );
  }

  const TableSwitchButtons = []
  for (const tracer of state.tracer.values()){
    if(tracer.tracer_type === TRACER_TYPE.ACTIVITY)
      TableSwitchButtons.push(renderTableSwitchButton(tracer));
    }

    const underlineSpecial = activeTracer === -1;

    TableSwitchButtons.push((
      <Button
        className={SiteStyles.Margin15lr}
        key="special"
        sz="sm"
        onClick={() => {db.set("activeTracer", -1);
                        setActiveTracer(-1)
                        setActiveTable("injections")
                       }}
      >
          { underlineSpecial ? <u>Special</u> : "Special"}
      </Button>));

    // Keyword setting
    const OrderTable = Tables[activeTable]
    const newProps = {
      [PROP_ACTIVE_TRACER] : activeTracer,
      [PROP_ACTIVE_DATE] : activeDate
    }
    // State Keywords
    const serverConfig = state.server_config.get(1);
    const activity_deadline = (serverConfig !== undefined) ?
                                state[DATA_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE])
                              : undefined
    const injection_deadline = (serverConfig !== undefined) ?
                                  state[DATA_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE])
                              : undefined

    const calenderProps = {
      [CALENDER_PROP_DATE] : activeDate,
      [CALENDER_PROP_GET_COLOR] : getColorProduction(activity_deadline,
                                                     injection_deadline,
                                                     [...state.activity_orders.values()],
                                                     state.closed_date,
                                                     [...state.injection_orders.values()],
                                                     state.production),
      [CALENDER_PROP_ON_DAY_CLICK] : setActiveDate,
      [CALENDER_PROP_ON_MONTH_CHANGE] : productionGetMonthlyOrders(websocket),
    };

    return (
      <Container>
        <Row>
          <Col>
            {TableSwitchButtons}
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            <OrderTable

              {...newProps}
            />
          </Col>
          <Col sm={1}></Col>
          <Col sm={3}>
            <Calender {...calenderProps}/>
          </Col>
        </Row>
      </Container>
    );
  }


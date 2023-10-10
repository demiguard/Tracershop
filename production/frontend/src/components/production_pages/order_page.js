import React, { useState } from "react";
import { Button, Container, Row, Col } from 'react-bootstrap';
import { InjectionTable } from './injection_table.js';
import { ActivityTable } from './activity_table.js';
import { TRACER_TYPE, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE, KEYWORD_ID,
  CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE,
  CALENDER_PROP_DATE } from "~/lib/constants.js";
import { DATA_PRODUCTION, DATA_ACTIVITY_ORDER, DATA_TRACER, DATA_INJECTION_ORDER,
  DATA_CLOSED_DATE, DATA_SERVER_CONFIG, DATA_DEADLINE } from "~/lib/shared_constants.js";
import { db } from "~/lib/local_storage_driver.js";

import { Calender, getColorProduction, productionGetMonthlyOrders } from "../injectable/calender.js";

import SiteStyles from '~/css/Site.module.css'
import { KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE, KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE } from "~/dataclasses/keywords.js";
import { useWebsocket } from "../tracer_shop_context.js";

const Tables = {
  activity : ActivityTable,
  injections : InjectionTable
};

export function OrderPage(props) {
  const websocket = useWebsocket();

  let today = db.get("today");
  if(!today || !today instanceof Date){
    today = new Date();
  }

  let activeTracer = db.get("activeTracer");
  if(!activeTracer) {
    const tracers = [...props[DATA_TRACER].values()].filter(
      (tracer) => {return tracer.tracer_type === TRACER_TYPE.ACTIVITY}
    ).sort((a, b) => {return b.id - a.id})

    activeTracer = tracers.length ? tracers[0].id : -1;
    db.set("activeTracer", activeTracer);
  }

  const activeTable = (activeTracer == -1) ? Tables["injections"] : Tables["activity"]
  const [state, setState] = useState({
      date : today,
      activeTracer : activeTracer,
      activeTable  : activeTable
    });

  // Calender functions
  function setActiveDate(NewDate) {
    db.set("today", NewDate);
    setState({...state, date : NewDate})
  }

  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  function renderTableSwitchButton(tracer) {
    const underline = tracer[KEYWORD_ID] === state.activeTracer;

    return (
      <Button className={SiteStyles.Margin15lr} key={tracer.shortname} sz="sm" onClick={() => {
        db.set("activeTracer", tracer[KEYWORD_ID]);

        setState({...state, activeTracer : tracer[KEYWORD_ID], activeTable : Tables["activity"]})}}
      >
        {underline ? <u>{tracer.shortname}</u> : tracer.shortname}
      </Button>
    );
  }

  const TableSwitchButtons = []
  for (const [_, tracer] of props[DATA_TRACER]){
    if(tracer.tracer_type === TRACER_TYPE.ACTIVITY)
      TableSwitchButtons.push(renderTableSwitchButton(tracer));
  }

    const underlineSpecial = state.activeTracer === -1;

    TableSwitchButtons.push((
      <Button
        className={SiteStyles.Margin15lr}
        key="special"
        sz="sm"
        onClick={() => {db.set("activeTracer", -1);
                        setState({...state,
                                  activeTracer : -1,
                                  activeTable : Tables["injections"]}
                                )}}
      >
          { underlineSpecial ? <u>Special</u> : "Special"}
      </Button>));

    // Keyword setting
    const newProps = {...props}
    // State Keywords
    newProps[PROP_ACTIVE_TRACER] = state.activeTracer;
    newProps[PROP_ACTIVE_DATE] = state.date

    const serverConfig = newProps[DATA_SERVER_CONFIG].get(1)

    // TODO: THERE A BUG HERE, SERVER CONFIG MAY NOT BE DEFINED!
    const activity_deadline = props[DATA_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE]);
    const injection_deadline = props[DATA_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE]);

    const calenderProps = {};
    calenderProps[CALENDER_PROP_DATE] = state.date;
    calenderProps[CALENDER_PROP_GET_COLOR] = getColorProduction(activity_deadline,
                                                                injection_deadline,
                                                                [...props[DATA_ACTIVITY_ORDER].values()],
                                                                props[DATA_CLOSED_DATE],
                                                                [...props[DATA_INJECTION_ORDER].values()],
                                                                props[DATA_PRODUCTION])
    calenderProps[CALENDER_PROP_ON_DAY_CLICK] = setActiveDate;
    calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = productionGetMonthlyOrders(websocket);

    return (
      <Container>
        <Row>
          <Col>
            {TableSwitchButtons}
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            <state.activeTable
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


import React, { useState } from "react";
import { Button, Container, Row, Col } from 'react-bootstrap';
import { InjectionTable } from './injection_table.js';
import { ActivityTable } from './activity_table.js';
import { TRACER_TYPE, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE,
  DATABASE_ACTIVE_TRACER, DATABASE_TODAY} from "~/lib/constants.js";
import { db } from "~/lib/local_storage_driver.js";

import SiteStyles from '~/css/Site.module.css'

import { useTracershopState, useWebsocket , useTracershopDispatch} from "../tracer_shop_context.js";
import { ProductionCalender } from "../injectable/derived_injectables/production_calender.js";
import { Optional } from "~/components/injectable/optional.js";
import { UpdateToday } from "~/lib/state_actions.js";

const Tables = {
  activity : ActivityTable,
  injections : InjectionTable
};

export function OrderPage() {
  const state = useTracershopState();
  const dispatch = useTracershopDispatch()
  const websocket = useWebsocket();

  let /**@type {Date} */ today = state.today;
  let /**@type {Number | null} */ activeTracerInit = db.get(DATABASE_ACTIVE_TRACER);
  if(!activeTracerInit) {
    const tracers = [...state.tracer.values()].filter(
      (tracer) => {return tracer.tracer_type === TRACER_TYPE.ACTIVITY}
    ).sort((a, b) => {return b.id - a.id})

    activeTracerInit = tracers.length ? tracers[0].id : -1;
    db.set(DATABASE_ACTIVE_TRACER, activeTracerInit);
  }

  const activeTableInit = (activeTracerInit == -1) ? "injections" : "activity";
  const [activeTracer, setActiveTracer] = useState(activeTracerInit);
  const [activeTable, setActiveTable] = useState(activeTableInit);

  // Calender functions
  function setActiveDate(newDate) {
    dispatch(new UpdateToday(newDate, websocket));
  }

  // ##### Render functions ##### //

  function renderTableSwitchButton(tracer) {
    const underline = tracer.id === activeTracer;
    return (
      <Button className={SiteStyles.Margin15lr} key={tracer.shortname} sz="sm" onClick={() => {
        db.set("activeTracer", tracer.id);
        setActiveTracer(tracer.id)
        setActiveTable("activity")
        }}
      >
        <Optional exists={underline} alternative={<div>{tracer.shortname}</div>}>
          <u>{tracer.shortname}</u>
        </Optional>
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
  const OrderTable = Tables[activeTable];
  const newProps = {
    [PROP_ACTIVE_TRACER] : activeTracer,
    [PROP_ACTIVE_DATE] : today
  }

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
          <ProductionCalender
            active_date={today}
            on_day_click={setActiveDate}
          />
        </Col>
      </Row>
    </Container>
  );
}

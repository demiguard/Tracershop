import React, { Component } from "react";
import { Button, Row, Col, Container } from 'react-bootstrap';
import { InjectionTable } from './injection_table.js';
import { ActivityTable } from './activity_table.js';
import { TRACER_TYPE_ACTIVITY, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_DATE, JSON_PRODUCTION, JSON_CUSTOMER, PROP_WEBSOCKET, JSON_DELIVER_TIME, JSON_ISOTOPE, JSON_ACTIVITY_ORDER, JSON_TRACER, JSON_INJECTION_ORDER, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE, KEYWORD_ID, JSON_CLOSED_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, CALENDER_PROP_DATE, JSON_SERVER_CONFIG, JSON_DEADLINE } from "../../lib/constants.js";
import { db } from "../../lib/local_storage_driver.js";

import { Calender, getColorProduction, productionGetMonthlyOrders as productionGetMonthlyOrders, standardOrderMapping } from "../injectable/calender.js";

import SiteStyles from '../../css/Site.module.css'
import { KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE, KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE } from "../../dataclasses/keywords.js";

const Tables = {
  activity : ActivityTable,
  injections : InjectionTable
};

export class OrderPage extends Component {
  constructor(props) {
    super(props)

    let today = db.get("today");
    if(!today || !today instanceof Date){
      today = new Date();
    }

    let activeTracer = db.get("activeTracer");
    if(!activeTracer) {
      const tracers = [...this.props[JSON_TRACER].values()].filter(
        (tracer) => {return tracer.tracer_type === TRACER_TYPE_ACTIVITY}
        ).sort((a, b) => {return b.id - a.id})

      activeTracer = tracers.length ? tracers[0].id : -1;
      db.set("activeTracer", activeTracer);
    }

    const activeTable = (activeTracer == -1) ? Tables["injections"] : Tables["activity"]
    this.state={
      date : today,
      activeTracer : activeTracer,
      activeTable  : activeTable
    };
  }

  // Calender functions
  setActiveDate(NewDate) {
    db.set("today", NewDate);
    this.setState({...this.state, date : NewDate})
  }

  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  renderTableSwitchButton(tracer) {
    const underline = tracer[KEYWORD_ID] === this.state.activeTracer;

    return (
      <Button className={SiteStyles.Margin15lr} key={tracer.shortname} sz="sm" onClick={() => {
        db.set("activeTracer", tracer[KEYWORD_ID]);

        this.setState({...this.state, activeTracer : tracer[KEYWORD_ID], activeTable : Tables["activity"]})}}
      >
        {underline ? <u>{tracer.shortname}</u> : tracer.shortname}
      </Button>
    );
  }

  render() {
    const TableSwitchButtons = []
    for (const [_, tracer] of this.props[JSON_TRACER]){
      if(tracer.tracer_type === TRACER_TYPE_ACTIVITY)
        TableSwitchButtons.push(this.renderTableSwitchButton(tracer));
    }

    const underlineSpecial = this.state.activeTracer === -1;

    TableSwitchButtons.push((
      <Button
        className={SiteStyles.Margin15lr}
        key="special"
        sz="sm"
        onClick={() => {db.set("activeTracer", -1);this.setState({...this.state, activeTracer : -1, activeTable : Tables["injections"]})}}
      >
          { underlineSpecial ? <u>Special</u> : "Special"}
      </Button>));

    // Keyword setting
    const props = {...this.props}
    // State Keywords
    props[PROP_ACTIVE_TRACER] = this.state.activeTracer;
    props[PROP_ACTIVE_DATE] = this.state.date

    const serverConfig = this.props[JSON_SERVER_CONFIG].get(1)

    const activity_deadline = this.props[JSON_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE]);
    const injection_deadline = this.props[JSON_DEADLINE].get(serverConfig[KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE]);

    const calenderProps = {};
    calenderProps[CALENDER_PROP_DATE] = this.state.date;
    calenderProps[CALENDER_PROP_GET_COLOR] = getColorProduction(activity_deadline,
                                                                injection_deadline,
                                                                [...this.props[JSON_ACTIVITY_ORDER].values()],
                                                                this.props[JSON_CLOSED_DATE],
                                                                [...this.props[JSON_INJECTION_ORDER].values()],
                                                                this.props[JSON_PRODUCTION])
    calenderProps[CALENDER_PROP_ON_DAY_CLICK] = this.setActiveDate.bind(this);
    calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = productionGetMonthlyOrders(this.props[PROP_WEBSOCKET]);

    return (
      <Container>
        <Row>
          <Col>
            {TableSwitchButtons}
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            <this.state.activeTable
              {...props}
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
}

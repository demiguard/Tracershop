import React, { Component } from "react";
import { Button, Row, Col, Container } from 'react-bootstrap';
import { TOrderTable } from './injection_table.js';
import { ActivityTable } from './activity_table.js';
import { TRACER_TYPE_ACTIVITY, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_DATE, JSON_PRODUCTION, JSON_CUSTOMER, PROP_WEBSOCKET, JSON_DELIVER_TIME, JSON_ISOTOPE, JSON_ACTIVITY_ORDER, JSON_TRACER, JSON_INJECTION_ORDER, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE, KEYWORD_ID, JSON_CLOSED_DATE } from "../../lib/constants.js";
import { db } from "../../lib/local_storage_driver.js";

import { Calender, productionGetMonthlyOrders as productionGetMonthlyOrders, standardOrderMapping } from "../injectable/calender.js";

import SiteStyles from '../../css/Site.module.css'

const Tables = {
  activity : ActivityTable,
  injections : TOrderTable
};

export class OrderPage extends Component {
  constructor(props) {
    super(props)

    var today = db.get("today");
    if(!today){
      today = new Date();
    }

    var activeTracer = db.get("activeTracer");
    if(!activeTracer) {
      activeTracer = -1;
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

  setActiveMonth(NewMonth) {
    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    this.props[PROP_WEBSOCKET].send(message);
  }

  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  renderTableSwitchButton(tracer) {
    const underline = tracer[KEYWORD_ID] === this.state.activeTracer;

    console.log(tracer)

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
    const props = {}
    // Inherited Keywords
    props[JSON_ACTIVITY_ORDER] = this.props[JSON_ACTIVITY_ORDER]
    props[JSON_CUSTOMER] = this.props[JSON_CUSTOMER]
    props[JSON_DELIVER_TIME] = this.props[JSON_DELIVER_TIME]
    props[JSON_ISOTOPE] = this.props[JSON_ISOTOPE]
    props[JSON_INJECTION_ORDER] = this.props[JSON_INJECTION_ORDER]
    props[JSON_PRODUCTION] = this.props[JSON_PRODUCTION]
    props[JSON_TRACER] = this.props[JSON_TRACER]
    props[PROP_WEBSOCKET] = this.props[PROP_WEBSOCKET]
    // State Keywords
    props[PROP_ACTIVE_TRACER] = this.state.activeTracer;
    props[PROP_ACTIVE_DATE] = this.state.date

    console.log(this.props)
    const calenderProps = {}
    calenderProps.date = this.state.date;
    calenderProps.onDayClick = this.setActiveDate.bind(this)
    calenderProps.onMonthChange = productionGetMonthlyOrders(this.props[PROP_WEBSOCKET])
    calenderProps.getColor = standardOrderMapping(this.props[JSON_ACTIVITY_ORDER],
                                                  this.props[JSON_INJECTION_ORDER],
                                                  this.props[JSON_PRODUCTION],
                                                  this.props[JSON_CLOSED_DATE])

    return (
      <Container>
        <Row>
          <Col>
            {TableSwitchButtons}
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            {/*
            <this.state.activeTable
              customer={this.props[JSON_CUSTOMER]}
              deliverTimes={this.props.deliverTimes}
              employee={this.props.employee}
              isotopes={this.props.isotopes}
              orders={this.props.orders}
              runs={this.props.run}
              t_orders={this.props.t_orders}
              active_tracer={this.state.activeTracer}
              tracers={this.props.tracer}
              vials={this.props.vial}
              websocket={this.props[PROP_WEBSOCKET]}
              date={this.state.date}
            />
            */}
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

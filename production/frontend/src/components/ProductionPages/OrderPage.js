import React, { Component } from "react";
import { Button, Row, Col, Container as div } from 'react-bootstrap';
import { TOrderTable } from './InjectionTable.js';
import { ActivityTable } from './ActivityTracerTable.js';
import { TRACER_TYPE_ACTIVITY, JSON_ISOTOPE, JSON_TRACER, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_DATE } from "../../lib/constants.js";
import { db } from "../../lib/localStorageDriver";

import { Calender, producitonGetMonthlyOrders as productionGetMonthlyOrders, standardOrderMapping } from "../injectables/calender.js";

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
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    this.props.websocket.send(message);
  }

  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  renderTableSwitchButton(tracer) {
    const underline = tracer.id === this.state.activeTracer;

    return (
      <Button className={SiteStyles.Margin15lr} key={tracer.name} sz="sm" onClick={() => {
        db.set("activeTracer", tracer.id);

        this.setState({...this.state, activeTracer : tracer.id, activeTable : Tables["activity"]})}}
      >
        {underline ? <u>{tracer.name}</u> : tracer.name}
      </Button>
    );
  }

  render() {
    const TableSwitchButtons = []
    for (const [_, tracer] of this.props.tracers){
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

    return (
      <div>
        <Row>
          <Col>
            {TableSwitchButtons}
          </Col>
          
        </Row>
        <Row>
          <Col sm={8}>
            <this.state.activeTable
              customers={this.props.customers}
              date={this.state.date}
              deliverTimes={this.props.deliverTimes}
              employee={this.props.employee}
              isotopes={this.props.isotopes}
              orders={this.props.orders}
              runs={this.props.runs}
              t_orders={this.props.t_orders}
              tracer={this.state.activeTracer}
              tracers={this.props.tracers}
              vials={this.props.vials}
              websocket={this.props.websocket}
            />
          </Col>
          <Col sm={1}></Col>
          <Col sm={3}>
            <Calender
              date={this.state.date}
              onDayClick={this.setActiveDate.bind(this)}
              onMonthChange={productionGetMonthlyOrders(this.props.websocket)}
              getColor={standardOrderMapping(this.props.orders, this.props.t_orders, this.props.runs, this.props.closeddates)}
              />
          </Col>
        </Row>
      </div>
    );
  }
}

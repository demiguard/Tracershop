import React, { Component } from "react";
import { Button, Row, Col, Container } from 'react-bootstrap'
import { Calender } from './calender'
import { TOrderTable } from './TOrderTable'
import { ActivityTable } from './ActivityTracerTable'
import { ajax } from "jquery";
import { TRACER_TYPE_ACTIVITY, JSON_ISOTOPE, JSON_TRACER, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_DATE } from "./lib/constants.js";
import { ParseJSONstr } from "./lib/formatting";
import { db } from "./lib/localStorageDriver";
import { CompareDates } from "./lib/utils";
export {OrderPage}

export default class OrderPage extends Component {
  constructor(props) {
    super(props)

    var today = db.get("today");
    if(!today){
      today = new Date();
    }

    var activeTracer = db.get("activeTracer")
    if(!activeTracer) {
      activeTracer = -1;
      db.set("activeTracer", activeTracer);
    }

    this.state={
      date : today,
      activeTracer : activeTracer,
    };
  }

  // Calender functions
  setActiveDate(NewDate) {
    db.set("today", NewDate);
    this.setState({...this.state, date : NewDate})
  }

  setActiveMonth(NewMonth) {
    console.log(NewMonth);
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    this.props.websocket.send(JSON.stringify(message));
  }

  getColor(DateStr) {
    // Maybe do this calculation once instead of 30 times
    var MinimumActivityStatus = 5;
    var MinimumInjectionStatus = 5;
    const date = new Date(DateStr);
    for(const [_, ActivityOrder] of this.props.orders){
      if(CompareDates(date, new Date(ActivityOrder.deliver_datetime))){
        MinimumActivityStatus = Math.min(MinimumActivityStatus, ActivityOrder.status);
      }
    }
    for(const [_, InjectionOrder] of this.props.t_orders){
      if(CompareDates(date, new Date(InjectionOrder.deliver_datetime))){
        MinimumInjectionStatus = Math.min(MinimumInjectionStatus, InjectionOrder.status);
      }
    }
    if (MinimumActivityStatus == 5){
      var CanProduce = false;
      for(const [_PTID, Run] of this.props.runs){
        if(Run.day == date.getDay()){
          CanProduce = true;
          break;
        }
      }
      if(CanProduce){
        const now = new Date();
        if(date > now){
          MinimumActivityStatus = 0;
        }
      }
    }
    return "date-status" + String(MinimumInjectionStatus) + String(MinimumActivityStatus);
  }
  // ##### End Calender Functions ##### //
  // ##### Render functions ##### //

  renderTableSwitchButton(tracer) {
    return (
      <Button className="navbarElem" key={tracer.name} sz="sm" onClick={() => {
        db.set("activeTracer", tracer.id);
        this.setState({...this.state, activeTracer : tracer.id})}}
      >
        {tracer.name}
      </Button>
    );
  }

  renderActiveTable() {
    switch(this.state.activeTracer){
      case null:
        //
        return (<div></div>)
      case -1:
        return (
        <TOrderTable
          date={this.state.date}
          key="Special table"
        />);
      default:
        return(
          <ActivityTable
            date={this.state.date}
            tracer={this.state.activeTracer}
            username={this.props.username}
            customer={this.props.customer}
            deliverTimes={this.props.deliverTimes}
            employees={this.props.employees}
            isotopes={this.props.isotopes}
            orders={this.props.orders}
            runs={this.props.runs}
            t_orders={this.props.t_orders}
            tracers={this.props.tracers}
            vials={this.props.vials}
            websocket={this.props.websocket}
            />
        );
    }
  }

  render() {
    const TableSwitchButtons = []
    for (const [_, tracer] of this.props.tracers){
      if(tracer.tracer_type === TRACER_TYPE_ACTIVITY)
        TableSwitchButtons.push(this.renderTableSwitchButton(tracer));
    }

    TableSwitchButtons.push((
      <Button
        className="navbarElem"
        key="special"
        sz="sm"
        onClick={() => {this.setState({...this.state, activeTracer : -1})}}
      >
          Special
      </Button>));

    return (
      <Container>
        <Row>
          <div>
            {TableSwitchButtons}
          </div>
        </Row>
        <Row>
          <Col sm={8}>
            {this.renderActiveTable()}
          </Col>
          <Col sm={1}></Col>
          <Col sm={3}>
            <Calender
              date={this.state.date}
              onDayClick={this.setActiveDate.bind(this)}
              onMonthChange={this.setActiveMonth.bind(this)}
              getColor={this.getColor.bind(this)}
              />
          </Col>
        </Row>
      </Container>
    );
  }
}

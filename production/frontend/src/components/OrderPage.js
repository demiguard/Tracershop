import React, { Component } from "react";
import { Button, Row, Col, Container } from 'react-bootstrap'
import { Calender } from './calender'
import { TOrderTable } from './TOrderTable'
import { ActivityTable } from './ActivityTracerTable'
import { ajax } from "jquery";
import { TRACER_TYPE_ACTIVITY } from "./lib/constants";
export {OrderPage}

export default class OrderPage extends Component {
  constructor(props) {
    super(props)

    const today = new Date();
    this.state={
      date : today,
      activeTracer    : null,
      ActivityTracers : new Array(),
    };

    this.activeTracer = this.activeTracer.bind(this);


    ajax({
      url: "api/gettracers",
      type:"GET"
    }).then((data) => {
      const isotopeMap = new Map();
      for(const isotope of data["isotope"]){
        isotopeMap.set(isotope.ID, isotope)
      }
      const newTracers = new Array();
      for(const tracer of data["tracer"]){
        if(tracer.tracer_type != TRACER_TYPE_ACTIVITY) continue
        const tracer_isotope = isotopeMap.get(tracer.isotope);
        newTracers.push({
          id       : tracer.id,
          name     : tracer.name,
          isotope  : tracer_isotope.name, 
          halflife : tracer_isotope.halflife,
        });
      }
      if(newTracers.length > 0) {
        this.setState({
          ...this.state,
          ActivityTracers : newTracers,
          activeTracer    : newTracers[0]
        });
      }
    });
  }

  // Calender functions
  updateCalenderColors(year, month) {
    return ajax({
      url : "api/monthcolor",
      type:"POST",
      dataType : "json",

      data : JSON.stringify({
        month : month + 1,
        year  : year
      }),
    })
  }

  setActiveDate(NewDate, Calender) {
    this.setState({...this.state, date : NewDate})
  }

  getColor(DateStr, ColorDict) {
    return (DateStr in ColorDict) ? "date-status" + String(ColorDict[DateStr]) : "date-status55"; 
  }
  // End Calender Functions

  // Set 
  activeTracer(NewTracer) {
    this.setState({...this.state, activeTracer : NewTracer});
  }

  renderTableSwitchButton(tracer) {
    return (
      <Button className="navbarElem" key={tracer.name} sz="sm" onClick={(args) => {
        this.activeTracer(tracer).bind(this)}}
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
      case "Special":
        return (
        <TOrderTable 
          date={this.state.date}
          key="Special table"
        />);
      default:
        return(
          <ActivityTable 
            key="Activity table"
            date={this.state.date}
            tracer={this.state.activeTracer}
            />
        );
    }
  }

  render() {
    const TableSwitchButtons = []
    for (const tracer of this.state.ActivityTracers){
      TableSwitchButtons.push(this.renderTableSwitchButton(tracer));
    }
    
    TableSwitchButtons.push((
      <Button 
        className="navbarElem" 
        key="special" 
        sz="sm"
        onClick={() => {this.activeTracer("Special")}}
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
              updateColors={this.updateCalenderColors}
              getColor={this.getColor}
              />
          </Col>
        </Row>
      </Container>
    );
  }
}
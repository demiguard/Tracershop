import React, { Component } from "react";
import { Button, Row, Col, Container } from 'react-bootstrap'
import { Calender } from './calender'
import { FDGTable } from './FDGTable'
import { FETTable } from './FETTable' 
import { TOrderTable } from './TOrderTable'

export {OrderPage}

const TableOrder = {
  FDG     : FDGTable,
  FET     : FETTable,
  Special : TOrderTable
}


export default class OrderPage extends Component {
  constructor(props) {
    super(props)

    const today = new Date();
    this.state={
      date : today,
      activeTable : FDGTable



    };
  }

  setActiveDate(NewDate) {
    this.setState({...this.state, date : NewDate})
  }

  setActiveTable(NewTableName) {
    const NewTable = TableOrder[NewTableName];
    this.setState({...this.state, activeTable : NewTable});
    console.log(this.state);
  }

  renderTableSwitchButton(TableName) {
    return (
      <Button className="navbarElem" key={TableName} sz="sm" onClick={() => this.setActiveTable(TableName)}>{TableName}</Button>
    );
  }

  renderActiveTable() {
    return (
      <this.state.activeTable/>
    )
  }

  render() {
    const TableSwitchButtons = [];
    const names = Object.keys(TableOrder);
    for(let i=0; i<names.length; i++){
      const TableName = names[i];
      TableSwitchButtons.push(this.renderTableSwitchButton(TableName));
    }


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
              />
          </Col>
        </Row>
      </Container>
    );
  }
}
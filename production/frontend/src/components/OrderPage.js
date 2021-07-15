import React, { Component } from "react";
import { Row, Col, Table, Tab } from 'react-bootstrap'
import { Calender } from './calender'


export {OrderPage}

export default class OrderPage extends Component {
  constructor(props) {
    super(props)

    const today = new Date();
    this.state={
      date : today,
      calenderMonth : today.getMonth(),
      calenderColors : {},
      FDGOrders : {

      },
      TOrders : {

      }
    };
  }
  





  render() {
    console.log(this.state)
    return (
      <Row>
        <Col sm={4}>
          <Table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Order ID</th>
                <th>kunde</th>
                <th>amount</th>
              </tr>
            </thead>
          </Table>
        </Col>
        <Col sm={4}>
          <Table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Order ID</th>
                <th>Kunde </th>
                <th>Tracer</th>
                <th>Inj</th>
                
              </tr>
            </thead>
          </Table>
        </Col>
        <Col sm={1}></Col>
        <Col sm={3}><Calender
          date={this.state.date}
        ></Calender></Col>
      </Row>
    
    );
  }
}
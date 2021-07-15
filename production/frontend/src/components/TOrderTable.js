import React, { Component } from "react";
import { Row, Col, Table, Tab } from 'react-bootstrap'
import { Calender } from './calender'


export {TOrderTable}

export default class TOrderTable extends Component {
  constructor(props) {
    super(props)
  }


  render() {
    return (
      <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>kunde</th>
            <th>Tracer</th>
          </tr>
        </thead>
      </Table>
    );
  }
}
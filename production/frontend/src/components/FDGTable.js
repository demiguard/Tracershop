import React, { Component } from "react";
import { Row, Col, Table, Tab } from 'react-bootstrap'


export {FDGTable}

export default class FDGTable extends Component {
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
            <th>amount</th>
          </tr>
        </thead>
      </Table>
    );
  }
}
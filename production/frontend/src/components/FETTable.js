import React, { Component } from "react";
import { Table} from 'react-bootstrap'

export {FETTable}

export default class FETTable extends Component {
  constructor(props) {
    super(props)
  }


  render() {
    return (
      <div>
        FET Tracer
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
      </div>
    );
  }
}
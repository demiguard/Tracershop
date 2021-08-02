import { ajax } from "jquery";
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button } from 'react-bootstrap'
import { renderStatusImage } from "./lib/Rendering";

export { FDGTable }

/*
  As all documentation in code, this might be out of date, 
  you can find the true answer in the SQLController / SQLLegacyController file
  Orders are Native Objects on the format: 
  {
    status       : Int
    oid          : Int
    run          : Int
    realname     : String
    amount       : Float
    total_amount : Float
    deliver_datetime : Str //note it's on a date time format where you can call new Date(orders.delivers_datetime)

  }


*/


export default class FDGTable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      orders : []
    }
    this.updateState(this.props.date)
  }

  updateState(newDate) {
    ajax({
      url:"api/getFDGOrders",
      type:"post",
      dataType : "json",
      data : JSON.stringify({
        year : newDate.getFullYear(),
        month : newDate.getMonth() + 1,
        day : newDate.getDate(),
      })
    }).then((NewOrdersJson) => {
      const newState = {
        ...this.state,
        orders : NewOrdersJson["Orders"]
      }
      this.setState(newState)
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.date !== prevProps.date && this.props.userid !== null) {
      this.updateState(this.props.date)
    }
  }
  // Functions 

  AcceptOrder() {

  }



  // Renders 
  renderRunSelect(init) {
    return (
      <select defaultValue={init}>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    )
  }


  renderOrder(i) {
    const Order = this.state.orders[i];
    var Run;
    if (Order.status === 1) Run = ""
    if (Order.status === 2) Run = this.renderRunSelect(Order.run)
    if (Order.status === 3) Run = String(Order.run)

    return (
    <tr key={i}> 
      <td>{renderStatusImage(Order.status)}</td>
      <td>{Order.oid}</td>
      <td>{Order.realname}</td>
      <td>{Order.amount}</td>
      <td>{Order.total_amount}</td>
      <td>{Run}</td>
      <td><Button variant="light" onClick={() => this.AcceptOrder(i)}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>
      <td><Button variant="light"><img className="statusIcon" src="/static/images/decline.svg"></img></Button></td>
    </tr>)
  }

  render() {
    var orders = []
    for (let i = 0; i < this.state.orders.length; i++){
      orders.push(this.renderOrder(i))
    }


    return (
      <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Bestilt</th>
            <th>Med Overhead</th>
            <th>Kørsel</th>
            <th>Accept</th>
            <th>Afvis</th>
          </tr>
        </thead>
        <tbody>
          {orders}
        </tbody>
      </Table>
    );
  }
}
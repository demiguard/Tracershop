import { ajax } from "jquery";
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button } from 'react-bootstrap'
import { CompareDates } from "./lib/utils";
import { renderStatusImage } from './lib/Rendering'
import ReactHover, { Trigger, Hover  } from "react-hover"
import { FormatDateStr, ParseJSONstr } from "./lib/formatting";
import { SpecialTracerWebsocket } from "./lib/SpecialTracerWebsocket";

import {JSON_ORDERS} from "./lib/constants.js"

export { TOrderTable }

class TOrderTable extends Component {
  constructor(props) {
    super(props)
    
  }

  
  ShouldOrdersUpdate(newDate) {
    return CompareDates(newDate, this.props.date) 
  }

  changeStatusIncomming(date, oid, status){
    if(this.ShouldOrdersUpdate(date)){
      this.changeStatus(oid, status);
    }
  }

  changeStatus(oid, status) {
      const newOrderMap = new Map(this.state.orders);
      const Order = {...newOrderMap.get(oid)};
      Order.status = status;
      newOrderMap.set(Order.oid, Order);
      this.setState({...this.state, orders: newOrderMap});
    }

  acceptOrder(oid) {
    this.changeStatus(oid, 2)

    this.websocket.send(JSON.stringify({
      "date"        : this.props.date,
      "messageType" : "changeStatus",
      "oid"         : oid,
      "status" : 2  
    }));
  }

  rejectOrder(oid) {
    this.changeStatus(oid, 0)
    
    this.websocket.send(JSON.stringify({
      "date"        : this.props.date,
      "messageType" : "changeStatus",
      "oid"         : oid,
      "status"      : 0
    }));
  }

  renderRejectOrder(Order) {
    if (Order.status == 1 || Order.status == 2) {
      return (
      <td>
        <Button variant="light"
          onClick={() => {this.rejectOrder(Order.oid)}}
        ><img className="statusIcon" src="/static/images/decline.svg"></img></Button>
      </td>);
    }

    return (<td></td>);
  }


  renderAcceptOrder(Order) {
    if (Order.status == 1) {
      return (
        <td>
        <Button variant="light"
          onClick={() => {this.acceptOrder(Order.oid)}}
          ><img className="statusIcon" src="/static/images/accept.svg"></img></Button>
      </td>);
  }
  
  return (<td></td>);
}


  renderComment (comment) {
    const TriggerOptions = {
      followCursor:false,
      shiftX: 20,
      shiftY: 0
    };

    if( comment) {
      return(
        <td>
        <ReactHover options={TriggerOptions}>
          <Trigger type="trigger">
            <img src="/static/images/comment.svg" className="statusIcon"></img>
          </Trigger>
          <Hover type="hover">
            <div className="CommentDiv">
              {comment}
            </div>
          </Hover>
        </ReactHover>
      </td>);
    } else {
      return (<td></td>);
    }
  }


  renderOrder(Order) {
    const OrderDT = new Date(Order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());


    return(
    <tr key={Order.oid}>
      <td>{renderStatusImage(Order.status)}</td>
      <td>{Order.oid}</td>
      <td>{Order.tracer}</td>
      <td>{Order.username}</td>
      <td>{Order.injections}</td>
      <td>{TimeStr}</td>
      <td>{Order.usage}</td>
      {this.renderComment(Order.comment)}
      {this.renderAcceptOrder(Order)}
      {this.renderRejectOrder(Order)}
    </tr>)
  }

  render() {
    const Orders = []
    

    return (
      <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Tracer</th>
            <th>Kunde</th>
            <th>Injektioner</th>
            <th>Bestilt Til</th>
            <th>Anvendelse</th>
            <th>Kommentar</th>
            <th>Accept</th>
            <th>Afvis</th>
          </tr>
        </thead>
        <tbody>
          {Orders}
        </tbody>
      </Table>
    );
  }
}
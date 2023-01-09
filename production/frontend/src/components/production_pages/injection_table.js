
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container, Modal } from 'react-bootstrap';

import { WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATATYPE, WEBSOCKET_DATA, JSON_INJECTION_ORDER, INJECTION_USAGE } from "../../lib/constants.js";
import { FormatDateStr, ParseJSONstr } from "../../lib/formatting.js";
import { renderTableRow, renderComment } from '../../lib/rendering.js';
import { compareDates } from "../../lib/utils.js";
import { CreateInjectionOrderModal } from "../modals/create_injection_modal.js";
import { InjectionModal } from "../modals/injection_modal.js";
import { StatusIcon, ClickableIcon } from "../injectable/icons.js";

const /** Contains the components of the different modals this page can display  @Enum */ Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal,
  InjectionStatus : InjectionModal
}
/** Page that contains all injections orders
 *
 */
export class TOrderTable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modal : Modals.NoModal,
      order : undefined
    }
  }

  openCreateOrderModal(){
    this.setState({...this.state, modal : Modals.CreateOrder});
  }

  closeModal(){
    this.setState({...this.state, modal : Modals.NoModal, order : undefined});
  }

  /** This is the function called when the users presses the accept button
   *
   * @param {Object} Order - The order that was accepted
   */
  acceptOrder(Order){
    if(Order.status == 1){
      Order.status = 2;
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
      message[WEBSOCKET_DATA] = Order;
      this.props.websocket.send(message);
    }
    else {
      this.openOrderModal(Order)
    }
  }

  /**
   * Opens the injection modal for an order.
   * @param {Object} order - Injection order that will open modal
   */
  openOrderModal(order){
    this.setState({
      ...this.state,
      modal : Modals.InjectionStatus,
      order : order,
    })
  }

  RejectOrder(Order){
    console.log(Order);
  }

  renderIncompleteOrder(order) {
    const OrderDT = new Date(order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());

    const Tracer = this.props.tracers.get(order.tracer);
    const TracerName = Tracer.name;
    const customer = this.props.customers.get(order.BID);

    const customerName = customer.UserName;


    return renderTableRow(
      order.oid,[
        <StatusIcon
          status={order.status}
          onClick={() => this.openOrderModal(order).bind(this)}
        />,
        order.oid,
        customerName,
        TracerName,
        order.n_injections,
        TimeStr,
        INJECTION_USAGE[String(order.anvendelse)],
        renderComment(order.comment),
        <ClickableIcon src={"/static/images/accept.svg"} onClick={() => this.acceptOrder(order)}/>,
        <ClickableIcon src={"/static/images/decline.svg"} onClick={() => this.RejectOrder(order)}/>,
      ]
    )
  }

  renderCompleteOrder(order) {
    const OrderDT = new Date(order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());

    const Free_datetime = new Date(order.frigivet_datetime);
    const Free_time_str = FormatDateStr(Free_datetime.getHours()) + ':' + FormatDateStr(Free_datetime.getMinutes());
    const Tracer = this.props.tracers.get(order.tracer);
    const TracerName = Tracer.name;
    const customer = this.props.customers.get(order.BID);

    const customerName = customer.UserName;

    const employee = this.props.employee.get(order.frigivet_af);
    let employeeName;
    if (employee == undefined){
      employeeName = `Ukendt frigiver med ID ${order.frigivet_af}`;
    } else {
      employeeName = employee.Username;
    }

    console.log(this.props)

    return renderTableRow(
      order.oid,[
        <StatusIcon status={order.status} onClick={() => this.openOrderModal(order)}/>,
        order.oid,
        customerName,
        TracerName,
        order.n_injections,
        TimeStr,
        INJECTION_USAGE[String(order.anvendelse)],
        renderComment(order.comment),
        Free_time_str,
        employeeName
      ]
    )
  }


  render() {
    console.log(this.props);

    const ordersIncomplete = [];
    const ordersComplete = [];

    for(const [_oid, t_order] of this.props.t_orders){
      const orderDate = new Date(t_order.deliver_datetime)
      if (compareDates(this.props.date, orderDate)){
        if(t_order.status < 3){
          ordersIncomplete.push(t_order);
        } else if (t_order.status == 3){
          ordersComplete.push(t_order);
        }
      }
    }
    return (
      <Container>
        <Row>
          <Col sm={10}>Produktion - {this.props.date.getDate()}/{this.props.date.getMonth() + 1}/{this.props.date.getFullYear()}</Col>
          <Col sm={2}>
            <Button onClick={this.openCreateOrderModal.bind(this)}>Opret ny ordre</Button>
          </Col>
        </Row>
      { ordersIncomplete.length > 0 ?
        <Table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Order ID</th>
              <th>Kunde</th>
              <th>Tracer</th>
              <th>Injektioner</th>
              <th>Bestilt Til</th>
              <th>Anvendelse</th>
              <th>Kommentar</th>
              <th>Accept</th>
              <th>Afvis</th>
            </tr>
          </thead>
          <tbody>
            {ordersIncomplete.map(this.renderIncompleteOrder.bind(this))}
          </tbody>
        </Table> : ""
      } {ordersComplete.length > 0 ?
        <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Tracer</th>
            <th>Injektioner</th>
            <th>Bestilt Til</th>
            <th>Anvendelse</th>
            <th>Kommentar</th>
            <th>Frigivet</th>
            <th>Frigivet af</th>
          </tr>
        </thead>
        <tbody>
          {ordersComplete.map(this.renderCompleteOrder.bind(this))}
        </tbody>
      </Table> : ""
      }
      { ordersComplete.length == 0 && ordersIncomplete.length == 0 ?
        <div>
          <p>Der er ingen Special ordre af vise til {this.props.date.getDate()}/{this.props.date.getMonth() + 1}/{this.props.date.getFullYear()}</p>
        </div> : null

      }

      {this.state.modal != Modals.NoModal ?
        <this.state.modal
          date={this.props.date}
          customers={this.props.customers}
          tracers={this.props.tracers}
          isotopes={this.props.isotopes}
          websocket={this.props.websocket}
          onClose={this.closeModal.bind(this)}
          order={this.state.order}
          employee={this.props.employee}
        ></this.state.modal> : ""}
      </Container>
    );
  }
}
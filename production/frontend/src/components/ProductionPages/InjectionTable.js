
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container, Modal } from 'react-bootstrap';

import { WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATATYPE, WEBSOCKET_DATA, JSON_INJECTION_ORDER } from "../../lib/constants";
import { FormatDateStr, ParseJSONstr } from "../../lib/formatting";
import { renderStatusImage, renderTableRow, renderComment } from '../../lib/Rendering';
import { renderClickableIcon } from "../../lib/Rendering";
import { CompareDates } from "../../lib/utils";
import { CreateInjectionOrderModal } from "../modals/InjectionCreateOrderModal";
import { InjectionModalStatus2 } from "../modals/InjectionModalityStatus2";


const /** Contains the components of the different modals this page can display  @Enum */ Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal,
  InjectionStatus2 : InjectionModalStatus2

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
  AcceptOrder(Order){
    if(Order.status == 1){
      Order.status = 2;
      var test;
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
      message[WEBSOCKET_DATA] = Order;
      this.props.websocket.send(message);
    }
    else if(Order.status == 2){
      this.setState({
        ...this.state,
        modal : Modals.InjectionStatus2,
        order : Order,
      })
    }
  }

  RejectOrder(Order){
    console.log(Order);
  }

  renderIncompleteOrder(Order) {
    const OrderDT = new Date(Order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());

    const Tracer = this.props.tracers.get(Order.tracer);
    const TracerName = Tracer.name;
    const customer = this.props.customers.get(Order.BID);

    const customerName = customer.UserName;


    return renderTableRow(
      Order.oid,[
        renderStatusImage(Order.status, () => this.AcceptOrder(Order).bind(this)),
        Order.oid,
        customerName,
        TracerName,
        Order.n_injections,
        TimeStr,
        Order.anvendelse,
        renderComment(Order.comment),
        renderClickableIcon("/static/images/accept.svg", () => this.AcceptOrder(Order)),
        renderClickableIcon("/static/images/decline.svg", () => this.RejectOrder(Order))
      ]
    )
  }

  renderCompleteOrder(Order) {
    const OrderDT = new Date(Order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());

    const Free_datetime = new Date(Order.frigivet_datetime);
    const Free_time_str = FormatDateStr(Free_datetime.getHours()) + ':' + FormatDateStr(Free_datetime.getMinutes());
    const Tracer = this.props.tracers.get(Order.tracer);
    const TracerName = Tracer.name;
    const customer = this.props.customers.get(Order.BID);

    const customerName = customer.UserName;


    return renderTableRow(
      Order.oid,[
        renderStatusImage(Order.status),
        Order.oid,
        customerName,
        TracerName,
        Order.n_injections,
        TimeStr,
        Order.anvendelse,
        renderComment(Order.comment),
        Free_time_str,
        Order.frigivet_af
      ]
    )
  }


  render() {
    console.log(this.props);

    const Orders_incompelte = [];
    const Orders_complete = [];

    for(const [_oid, t_order] of this.props.t_orders){
      const orderDate = new Date(t_order.deliver_datetime)
      if (CompareDates(this.props.date, orderDate)){
        if(t_order.status < 3){
          Orders_incompelte.push(t_order);
        } else if (t_order.status == 3){
          Orders_complete.push(t_order);
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
      { Orders_incompelte.length > 0 ?
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
            {Orders_incompelte.map(this.renderIncompleteOrder.bind(this))}
          </tbody>
        </Table> : ""
      } {Orders_complete.length > 0 ?
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
          {Orders_complete.map(this.renderCompleteOrder.bind(this))}
        </tbody>
      </Table> : ""
      }
      { Orders_complete.length == 0 && Orders_incompelte.length == 0 ?
        <div>
          <p>Der er ingen Special ordre af vise til {this.props.date.getDate()}/{this.props.date.getMonth() + 1}/{this.props.date.getFullYear()}</p>
        </div> : null

      }

      {this.state.modal != Modals.NoModal ?
        <this.state.modal
          date={this.props.date}
          customers={this.props.customers}
          tracers={this.props.tracers}
          websocket={this.props.websocket}
          onClose={this.closeModal.bind(this)}
          order={this.state.order}
          employee={this.props.employee}
        ></this.state.modal> : ""}
      </Container>
    );
  }
}
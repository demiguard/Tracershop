
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container, Modal } from 'react-bootstrap';
import { CompareDates } from "/src/lib/utils";
import { renderStatusImage, renderTableRow, renderComment } from '/src/lib/Rendering';

import { FormatDateStr, ParseJSONstr } from "/src/lib/formatting";
import { WEBSOCKET_MESSAGE_EDIT_STATE } from "/src/lib/constants";
import { CreateInjectionOrderModal } from "/src/components/modals/InjectionCreateOrderModal";
import { renderClickableIcon } from "../../lib/Rendering";
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


  changeStatus(oid, status) {
      const order = this.props.t_orders.get(oid);
      if (order.status == status) return;
      order.status = status;

      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
      message[WEBSOCKET_DATA] = order;
      this.props.websocket.send(JSON.stringify(message));
    }


  openCreateOrderModal(){
    this.setState({...this.state, modal : Modals.CreateOrder});
  }

  closeModal(){
    this.setState({...this.state, modal : Modals.NoModal, order : undefined});
  }

  AcceptOrder(Order){
    console.log(Order);
    if(Order.status == 2){
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

  renderOrder(Order) {
    const OrderDT = new Date(Order.deliver_datetime)
    const TimeStr = FormatDateStr(OrderDT.getHours()) + ':' + FormatDateStr(OrderDT.getMinutes());

    const Tracer = this.props.tracers.get(Order.tracer);
    const TracerName = Tracer.name;
    const customer = this.props.customer.get(Order.BID);

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
        renderClickableIcon("/static/images/accept.svg", () => this.AcceptOrder(Order)),
        renderClickableIcon("/static/images/decline.svg", () => this.RejectOrder(Order))
      ]
    )
  }

  render() {
    console.log(this.props)

    const Orders = [];

    for(const [_oid, t_order] of this.props.t_orders){
      const orderDate = new Date(t_order.deliver_datetime)
      if (CompareDates(this.props.date, orderDate)){
        Orders.push(t_order);
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
          {Orders.map(this.renderOrder.bind(this))}
        </tbody>
      </Table>
      {this.state.modal != Modals.NoModal ?
        <this.state.modal
          date={this.props.date}
          customer={this.props.customer}
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
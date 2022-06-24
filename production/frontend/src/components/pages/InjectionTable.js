
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container, Modal } from 'react-bootstrap';
import { CompareDates } from "/src/lib/utils";
import { renderStatusImage } from '/src/lib/Rendering';
import ReactHover, { Trigger, Hover  } from "react-hover";
import { FormatDateStr, ParseJSONstr } from "/src/lib/formatting";
import { WEBSOCKET_MESSAGE_EDIT_STATE } from "/src/lib/constants";
import { CreateInjectionOrderModal } from "/src/components/modals/InjectionCreateOrderModal";

const /** Contains the components of the different modals this page can display  @Enum */ Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal
}
/** Page that contains all injections orders
 *
 */
export class TOrderTable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modal : Modals.NoModal
    }
  }


  changeStatus(oid, status) {
      const order = this.props.t_orders.get(oid);
      order.status = status;

      this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    }


  openCreateOrderModal(){
    this.setState({...this.state, modal : Modals.CreateOrder});
  }

  closeModal(){
    this.setState({...this.state, modal : Modals.NoModal});
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

    if(comment) {
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
    console.log(this.props)

    const Orders = [];

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
      {this.state.modal != Modals.NoModal ?
        <this.state.modal
          date={this.props.date}
          customer={this.props.customer}
          tracers={this.props.tracers}
          websocket={this.props.websocket}
          onClose={this.closeModal.bind(this)}
        ></this.state.modal> : ""}
      </Container>
    );
  }
}
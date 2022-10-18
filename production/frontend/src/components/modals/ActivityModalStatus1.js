import React, { Component } from "react";
import { Button, Modal, Table, Row, Col } from "react-bootstrap";
import { JSON_ACTIVITY_ORDER, KEYWORD_AMOUNT, KEYWORD_AMOUNT_O, KEYWORD_TOTAL_AMOUNT, KEYWORD_TOTAL_AMOUNT_O, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../lib/constants";
import { renderClickableIcon, renderTableRow } from "../../lib/Rendering";


export { ActivityModalStatus1 }

class ActivityModalStatus1 extends Component {
  constructor(props){
    super(props);

    const order = this.props.orders.get(this.props.order);

    this.state = {
      editingOrderedActivity : false,
      editOrderActivity : order.amount
    }
  }

  toggleActivity(){
    const retfunc = (event) => {
      if(this.state.editingOrderedActivity){
        const order = this.props.orders.get(this.props.order);
        const customer = this.props.customers.get(order.BID);
        const newActivity = Number(this.state.editOrderActivity)
        if(isNaN(newActivity) ){
          this.setState({
            errorMessage : "Den bestilte aktivitet er ikke et tal"
          });
          return;
        }
        if(newActivity < 0 ){
          this.setState({
            errorMessage : "Der bestilte aktivitet kan ikke være negativ"
          });
          return;
        }

        // Activity from other orders assigned to total_* attributes
        const externalActivity = order.total_amount - order.amount;
        const newTotalActivity = newActivity + externalActivity;

        const newAmountOverhead = (1 + customer.overhead / 100) * newActivity;
        const newTotalAmountOverhead = (1 + customer.overhead / 100) * newTotalActivity;

        const newOrder = {...order};
        // This is why python is better
        newOrder[KEYWORD_AMOUNT] = newActivity;
        newOrder[KEYWORD_AMOUNT_O] = newAmountOverhead;
        newOrder[KEYWORD_TOTAL_AMOUNT] = newTotalActivity;
        newOrder[KEYWORD_TOTAL_AMOUNT_O] = newTotalAmountOverhead

        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = newOrder;
        message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;

        this.props.websocket.send(message);

        this.setState({
          ...this.state,
          errorMessage : "",
          editingOrderedActivity : false
        });
      } else {
        this.setState({
          ...this.state,
          editingOrderedActivity : true
        })
      }
    }
    return retfunc.bind(this)
  }

  render(){
    const order = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID)
    const CustomerName = (customer) ? customer.UserName + " - " + customer.Realname : "";
    const formattetOrderTime = `${order.deliver_datetime.substring(11,13)
    }:${order.deliver_datetime.substring(14,16)} - ${order.deliver_datetime.substring(8,10)
    }/${order.deliver_datetime.substring(5,7)}/${order.deliver_datetime.substring(0,4)}`;

    return (
      <Modal
        show={this.props.show}
        size="lg"
        onHide={this.props.onClose}
      >
        <Modal.Header>Order {order.oid}</Modal.Header>
        <Modal.Body>
        <div>
          <Table striped bordered>
            <tbody>
              {renderTableRow("1", ["Destination:" , CustomerName])}
              {renderTableRow("2", ["Kørsel: ", order.run])}
              {renderTableRow("3", ["Bestilt til:", formattetOrderTime])}
              {renderTableRow("4", ["Bestilt af:", order.username])}
              {renderTableRow("5", ["Bestilt aktivitet",
                <Row>
                  <Col>{this.state.editingOrderedActivity ?
                    <FormControl
                      value={this.state.editOrderActivity}
                      onChange={changeState("editOrderActivity", this).bind(this)}
                    /> : order.amount}
                  </Col>
                  <Col md="auto" className="justify-content-end">{
                    this.state.editingOrderedActivity ?
                      renderClickableIcon("/static/images/accept.svg", this.toggleActivity().bind(this)) :
                      renderClickableIcon("/static/images/pen.svg", this.toggleActivity().bind(this))}
                    {renderClickableIcon("/static/images/calculator.svg")}
                  </Col>
                </Row>
              ])}
              {renderTableRow("6", ["Total aktivitet:", order.total_amount * (1 + customer.overhead / 100)])}
              {order.comment ? renderTableRow("7", ["Kommentar", order.comment]) : null}
            </tbody>
          </Table>
        </div>
        </Modal.Body>
        <Modal.Footer>
          <Button>Accepter</Button>
          <Button onClick={this.props.onClose}>Luk</Button>
        </Modal.Footer>
      </Modal>);
  }
}
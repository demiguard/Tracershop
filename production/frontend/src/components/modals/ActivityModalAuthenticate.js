import React, { Component } from "react";
import { Modal, Button, Container, Col, Table, Row } from "react-bootstrap";

import Authenticate from "../injectables/Authenticate";

import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_AUTH, WEBSOCKET_MESSAGE_AUTH_LOGIN } from "../../lib/constants";
import { renderTableRow } from "../../lib/Rendering";
import { renderOnClose } from "../../lib/Rendering";

import styles from '../../css/Site.module.css'

export { ActivityModalAuthenticate }


export default class ActivityModalAuthenticate extends Component {
  /**
    * Props
    *  @param {Boolean} show - Should the modal be shown or not
    *  @param {CallableFunction} onClose - Function to be called if the user wishes to close the modal
    *  @param {CallableFunction} cancel - Function called when the user wish to cancel the authentication
    *  @param {Object} Order - Object with information on the order
    *  @param {} selectedVials
            accept={this.props.AcceptOrder}
 */

  constructor(props){
    super(props);
    this.state = {
      login_message : ""
    }
  }

  auth(username, password){
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    const auth = {}
    auth[AUTH_USERNAME] = username
    auth[AUTH_PASSWORD] = password
    message[JSON_AUTH] = auth;
    const loginPromise = this.props.websocket.send(message).then((data) => {
      if (data[AUTH_IS_AUTHENTICATED]){
        this.props.accept(this.props.order, this.props.selectedVials);
      } else {
        const newState = {...this.state,
          login_message : "Forkert Login",
        }
      }
    });
  }

  CloseModal(){
    this.props.onClose();
  }

  render() {
    const Order = this.props.orders.get(this.props.order);
    const OrderID = (Order) ? Order.oid : "";

    const Customer = this.props.customers.get(Order.BID);
    const CustomerNumber = (Customer) ? Customer.kundenr  : "";
    const CustomerName   = (Customer) ? Customer.UserName + " - " + Customer.Realname : "";
    const Activity       = (Order) ? Order.total_amount_o : "";

    const Vials = [];
    var AssignedActivity = 0;
    for (let vialID of this.props.selectedVials) {
      const Vial = this.props.vials.get(vialID)
      AssignedActivity += Number(Vial.activity)
      Vials.push(renderTableRow(Vial.ID, ["Vial", Vial.ID]))
    }



    return (
      <Modal
      show={this.props.show}
      size="lg"
      onHide={renderOnClose(this.props.onClose)}
      className={styles.mariLight}
      >
      <Modal.Header>Frigiv Order {OrderID}</Modal.Header>
      <Modal.Body>
        <Container>
          <Row>

          <Col xs={4}>
          <Authenticate
            login_message="Frigiv Ordre"
            authenticate={this.auth.bind(this)}
            ErrorMessage={this.state.ErrorMessage}
            fit_in={false}
            />
          </Col>
          <Col xs={8}>
            <Table striped bordered>
              <tbody>
                {renderTableRow("0", ["Order ID", OrderID])}
                {renderTableRow("1", ["Kunde nummber:", CustomerNumber])}
                {renderTableRow("2", ["Navn:" , CustomerName])}
                {renderTableRow("3", ["Ønsket aktivitet:", Activity])}
                {renderTableRow("4", ["Allokeret Aktivitet:", AssignedActivity])}
                {renderTableRow("5", ["Bestilt Af:",  Order.username])}
                {Order.comment ? renderTableRow("6", ["Kommentar", Order.comment]) : null}
                {Vials}
              </tbody>
            </Table>
          </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.props.cancel}> Tilbage </Button>
        {renderOnClose(this.props.onClose)}
      </Modal.Footer>
    </Modal>);
  }
}

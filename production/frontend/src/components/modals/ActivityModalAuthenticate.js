import React, { Component } from "react";
import { Modal, Container, Col, Table, Row } from "react-bootstrap";
import propTypes from 'prop-types'

import Authenticate from "../injectables/Authenticate";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_ACTIVITY_ORDER, JSON_AUTH, JSON_VIAL, WEBSOCKET_DATA,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY } from "../../lib/constants";
import { renderTableRow } from "../../lib/Rendering";
import { renderOnClose } from "../../lib/Rendering";
import { TracerWebSocket } from "../../lib/TracerWebsocket";
import styles from '../../css/Site.module.css'

export { ActivityModalAuthenticate }


export default class ActivityModalAuthenticate extends Component {
  static propTypes = {
    order : propTypes.number.isRequired,
    orders : propTypes.instanceOf(Map).isRequired,
    selectedVials : propTypes.instanceOf(Set).isRequired,
    vials : propTypes.instanceOf(Map).isRequired,
    websocket : propTypes.instanceOf(TracerWebSocket).isRequired
  };

  constructor(props){
    super(props);
    this.state = {
      login_error : "",
      spinner : false,
    }
  }

  auth(username, password){
    this.setState({
      login_error : "",
      spinner : true,
    })
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const auth = {}
    auth[AUTH_USERNAME] = username
    auth[AUTH_PASSWORD] = password
    message[JSON_AUTH] = auth;
    const data = {};
    data[JSON_ACTIVITY_ORDER] = this.props.order;
    data[JSON_VIAL] = Array.from(this.props.selectedVials)

    message[WEBSOCKET_DATA] = data;
    const loginPromise = this.props.websocket.send(message).then((data) => {
      if (!data[AUTH_IS_AUTHENTICATED]){
        const newState = {...this.state,
          login_message : "Forkert Login",
          spinner : false
        }
        this.setState(newState);
      }
    });
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
      show={true}
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
                authenticate={this.auth.bind(this)}
                errorMessage={this.state.login_error}
                fit_in={false}
                headerMessage={`Frigiv Ordre - ${OrderID}`}
                spinner={this.state.spinner}
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
        {renderOnClose(this.props.onClose)}
      </Modal.Footer>
    </Modal>);
  }
}
